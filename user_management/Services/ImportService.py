# users/Services/ImportService.py
"""Ces services sont des vues lourdes.
            --> Import de nouveaux utilisateurs  """

import logging, uuid, pandas as pd
from django.db import transaction
from django.core.exceptions import ValidationError
from ..tasks import send_activation_email
import django.utils.timezone as timezone
from django.utils.timezone import now
from datetime import timedelta
from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import re , string, random
from rest_framework.exceptions import ValidationError as DRFValidationError
User = get_user_model()
logger = logging.getLogger(__name__)




@transaction.atomic
class UserImportService:
    """Service dédié à l'importation des utilisateurs"""

    model = User

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def log_security_event(self, event_type, details, user=None):
        self.logger.warning(f"Security event: {event_type}, Details: {details}, User: {user}")

    def log_error(self, event_type, error, details=None):
        self.logger.error(f"Error: {event_type}, Message: {str(error)}, Details: {details}")

    def log_action(self, event_type, level='info', details=None):
        getattr(self.logger, level)(f"Action: {event_type}, Details: {details}")

    def log_success(self, event_type, details=None):
        self.logger.info(f"Success: {event_type}, Details: {details}")

    def check_rate_limit(self, user, action):
        return True, {"limit": "100/hour", "current": 1}
    
    @staticmethod
    def generate_secure_temp_password(length: int = 12) -> str:
        """Génère un mot de passe temporaire sécurisé."""
        chars = string.ascii_letters + string.digits + string.punctuation
        rng = random.SystemRandom()

        while True:
            pw = ''.join(rng.choice(chars) for _ in range(length))
            if (re.search(r'[A-Za-z]', pw) and 
                re.search(r'\d', pw) and 
                re.search(r'[\W_]', pw)):
                return pw

    @staticmethod
    def normalize_email(email):
        return email.strip().lower()

    @transaction.atomic
    def import_from_csv(self, file_path, imported_by, activation_hours=48):
    # AJOUTEZ cette vérification
        if not isinstance(file_path, str):
            raise ValueError(f"Chemin de fichier invalide: {type(file_path)}")
        
        # AJOUTEZ un log pour déboguer
        self.logger.debug(f"Import from CSV: {file_path}, type: {type(file_path)}")
        
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            self.log_error('csv_read_error', e, {'file_path': file_path})
            raise ValueError(f"Impossible de lire le fichier CSV: {str(e)}")
        results = {
            'success': 0,
            'errors': [],
            'skipped': 0,
        }
        users_to_create = []
        emails_seen = set()

        allowed, rate_info = self.check_rate_limit(imported_by, action='import_users')
        if not allowed:
            self.log_security_event('import_users_rate_limited', rate_info, user=imported_by)
            raise ValidationError("Trop de requêtes, réessayez plus tard.")

        for i, row in df.iterrows():
            line_num = i + 2
            try:
                email_raw = row.get('email')
                if not email_raw:
                    raise ValidationError("Email manquant")
                normalized_email = self.normalize_email(email_raw)

                if normalized_email in emails_seen:
                    raise ValidationError("Email dupliqué dans le fichier")
                emails_seen.add(normalized_email)

                if self.model.objects.filter(email__iexact=normalized_email).exists():
                    raise ValidationError("Email déjà existant dans la base")

                password = self.generate_secure_temp_password
                data = {
                    'email': normalized_email,
                    'username': normalized_email.split('@')[0],
                    'first_name': row.get('prenom', ''),
                    'last_name': row.get('nom', ''),
                    'role': row.get('role', 'intern'),
                    'is_active': False,
                }
                user = self.model(**data)
                user.set_password(password)
                user.must_change_password = True
                user.password_expiry = timezone.now() + timedelta(hours=24)
                user.activation_token = str(uuid.uuid4())
                user.activation_token_expiry = timezone.now() + timedelta(hours=activation_hours)
                users_to_create.append(user)
            except ValidationError as ve:
                self.log_error('import_user_validation_error', ve, {'line': line_num, 'email': row.get('email')})
                results['errors'].append({'line': line_num, 'error': str(ve), 'data': dict(row)})
                results['skipped'] += 1

        if not users_to_create:
            self.log_action('import_users_no_valid_users', level='warning', details={'imported_by': imported_by})
            return results

        try:
            self.model.objects.bulk_create(users_to_create, ignore_conflicts=False)
        except Exception as e:
            self.log_error('import_users_db_integrity_error', e, {'imported_by': imported_by})
            raise

        for user in users_to_create:
            user.refresh_from_db()

        results['success'] = len(users_to_create)
        self.log_success('import_users_completed', {'count': results['success'], 'imported_by': imported_by})

        for user in users_to_create:
            try:
                send_activation_email.delay(
                    user.email,
                    user.first_name,
                    user.activation_token,
                    user.activation_token_expiry.isoformat(),
                    user.password_expiry.isoformat()
                )
                self.log_success('activation_email_sent', {'email': user.email})
            except Exception as exc:
                self.log_error('activation_email_failed', exc, {'email': user.email})

        return results