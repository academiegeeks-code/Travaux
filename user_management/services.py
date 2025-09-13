# users/services.py
"""Ces services sont des vues lourdes. Pour plus d'éfficacité, nous avons mis de coté la logique
    Lourde dans services.py: notament
            --> Import de nouveaux utilisateurs
            --> Export de liste sur la base de Filtres 
            --> Onboarding (Tableau de bord personnel)  """

import logging, uuid, pandas as pd
from django.db import transaction
from django.core.exceptions import ValidationError
from .tasks import send_activation_email
from .models import self, generate_secure_temp_password
from datetime import timedelta, now
from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

@transaction.atomic
class UserImportService:
    """Service dedié à l'importation des utilisateurs"""

    @staticmethod
    def import_from_csv(file_path, imported_by, activation_hours=48):
        # Chargement du fichier CSV en DataFrame
        df = pd.read_csv(file_path)

        results = {
            'success': 0,
            'errors': [],
            'skipped': 0,
        }
        
        users_to_create = []
        emails_seen = set()

        # Rate limiting pour sécurité
        allowed, rate_info = self.check_rate_limit(imported_by, action='import_users')
        if not allowed:
            self.log_security_event('import_users_rate_limited', rate_info, user=imported_by)
            raise ValidationError("Trop de requêtes, réessayez plus tard.")

        # Validation ligne par ligne + préparation des users à créer
        for i, row in df.iterrows():
            line_num = i + 1
            try:
                email_raw = row.get('email')
                if not email_raw:
                    raise ValidationError("Email manquant")
                normalized_email = self.normalize_email(email_raw)

                # Doublons dans batch ?
                if normalized_email in emails_seen:
                    raise ValidationError("Email dupliqué dans le fichier")
                emails_seen.add(normalized_email)

                # Doublons en base
                if self.model.objects.filter(email=normalized_email).exists():
                    raise ValidationError("Email déjà existant dans la base")

                # Préparation données utilisateur
                password = row.get('password') or generate_secure_temp_password()
                data = {
                    'email': normalized_email,
                    'first_name': row.get('first_name', ''),
                    'last_name': row.get('last_name', ''),
                    'role': row.get('role', 'visitor'),
                    'is_active': False,
                    # Ajouter d’autres champs nécessaires
                }
                user = self.model(**data)
                user.set_password(password)
                user.must_change_password = True
                user.password_expiry = now() + timedelta(hours=24)

                # Attribution d'un Token d'activation unique à tous les comptes créés
                user.activation_token = uuid.uuid4()
                user.activation_token_expiry = now() + timedelta(hours=activation_hours)

                users_to_create.append(user)
            except ValidationError as ve:
                self.log_error('import_user_validation_error', ve, {'line': line_num, 'email': row.get('email')})
                results['errors'].append({'line': line_num, 'error': str(ve), 'data': dict(row)})
                results['skipped'] += 1
        
        if not users_to_create:
            self.log_action('import_users_no_valid_users', level='warning', details={'imported_by': imported_by})
            return results

        # 😎 Bulk create descend en  base pour verifier l'integrité et ecrire
        try:
            self.model.objects.bulk_create(users_to_create, ignore_conflicts=False)
        except IntegrityError as e:
            self.log_error('import_users_db_integrity_error', e, {'imported_by': imported_by})
            raise

        # Rafraichir les identifiants
        for user in users_to_create:
            user.refresh_from_db()

        results['success'] = len(users_to_create)
        self.log_success('import_users_completed', {'count': results['success'], 'imported_by': imported_by})

        # ☎📞Allô Celery, voici une Tâche: Envoi ces tokens par email en tâche asynchrone
        for user in users_to_create:
            try:
                send_activation_email.delay(
                    user.email,
                    user.first_name,
                    str(user.activation_token),
                    user.activation_token_expiry.isoformat(),
                    user.password_expiry.isoformat()
                )
                self.log_success('activation_email_sent', {'email': user.email})
            except Exception as exc:
                self.log_error('activation_email_failed', exc, {'email': user.email})

        return results

class UserExportService:
    """Service dédié à l'exportation des utilisateurs sur la base de filtres"""

    @staticmethod
    def export_to_csv(queryset, export_fields):
        data = []
        for user in queryset:
            user_data = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'status': user.status,
                'last_login': user.last_login.isoformat() if user.last_login else '',
                'is_active': 'Yes' if user.is_active else 'No'
            }

            if 'profile_data' in export_fields and hasattr(user, 'profile') and user.profile:
                user_data.update({
                    'profession': getattr(user.profile, 'profession', ''),
                    'specialty': getattr(user.profile, 'specialty', ''),
                    'university': getattr(user.profile, 'university_studies', '') or getattr(user.profile, 'university_teaches', '')
                })

            data.append(user_data)
        # Allô Panda. Tu as du travail ! 
        import pandas as pd
        df = pd.DataFrame(data)
        return df.to_csv(index=False, encoding='utf-8-sig')

# Service de Profilage de  l'utilisateur ---> Un tableau de bord personnel
class UserOnboardingService:
    @staticmethod
    @transaction.atomic
    def complete_onboarding(user, onboarding_data):
        try:
            profile_data = onboarding_data.get('profile', {})
            if hasattr(user, 'profile') and user.profile:
                for field, value in profile_data.items():
                    if hasattr(user.profile, field):
                        setattr(user.profile, field, value)
                user.profile.save()
            else:
                logger.warning(f"User {user.email} lacks profile for onboarding update")

            UserOnboardingService._assign_initial_permissions(user)
            UserOnboardingService._create_default_resources(user)
            UserOnboardingService._send_onboarding_notifications(user)

            logger.info(f"Onboarding completed successfully for {user.email}")

            return user

        except Exception as e:
            logger.error(f"Error during onboarding for {user.email}: {str(e)}")
            raise

    @staticmethod
    def _assign_initial_permissions(user):
        # Exemple : permissions selon rôle
        if user.role == 'admin':
            # Attribuer toutes les permissions
            pass
        elif user.role == 'user':
            # Permissions restreintes
            pass
        # Log ou raise si nécessaire

    @staticmethod
    def _create_default_resources(user):
        # Création de dossiers, projets, paramétrages initiaux
        pass

    @staticmethod
    def _send_onboarding_notifications(user):
        # Envoi email en tâche asynchrone
        from tasks import send_mail
        send_mail.delay(user.id)
        