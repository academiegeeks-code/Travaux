from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from django.utils import timezone  # if you track them manually
from django.conf import settings

from django.core.validators import validate_email
import logging
# Ensure you have a model for RefreshToken or adjust accordingly
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Email task for user activation
@shared_task
@shared_task(bind=True, max_retries=3, retry_backoff=True)
def send_activation_email(self, email, first_name, activation_token, activation_expiry, password_expiry):
    validate_email(email)
    try:
        subject = 'Bienvenue à BCEF - Activation de votre compte'
        message = (
            f'Bonjour {first_name or ""},\n\n'
            f'Votre compte a été créé. Utilisez ce token pour activer: {activation_token}\n'
            f'Validité du token: jusqu’au {activation_expiry}.\n'
            f'Votre mot de passe temporaire expire le {password_expiry}.\n\n'
            'Cordialement,\nÉquipe BCEF'
        )
        from django.conf import settings
        # Use the default from email and name
        DEFAULT_FROM_NAME = getattr(settings, 'DEFAULT_FROM_NAME', 'Équipe BCEF')
        # Send the email
        send_mail(subject, message, f"{DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>", [email])
        # Log the successful email sending
        logger.info(f"Activation email sent to {email}")
    except Exception as e:
        # Log the error and retry
        logger.error(f"Failed to send activation email to {email}: {e}")
        # Retry the task if sending fails
        self.retry(countdown=60)


#Email task for password reset
@shared_task
def send_password_reset_email(email, first_name, reset_token, expiry_date):
    try:
        subject = "Réinitialisation de votre mot de passe BCEF"
        message = (
            f"Bonjour {first_name or ''},\n\n"
            f"Vous avez demandé à réinitialiser votre mot de passe. Utilisez ce token: {reset_token}\n"
            f"Valide jusqu'au: {expiry_date}\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n"
            "Cordialement,\nÉquipe BCEF"
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        raise

# Celery Daily task to clean expired tokens
@shared_task
def clean_expired_tokens():
    from users.models import User  # Assuming you have a User model
    now = timezone.now()
    expired_activation = User.objects.filter(activation_token_expiry__lt=now)
    activation_count = expired_activation.count()
    expired_activation.update(activation_token=None, activation_token_expiry=None)
    
    expired_reset = User.objects.filter(password_reset_token_expiry__lt=now)
    reset_count = expired_reset.count()
    expired_reset.update(password_reset_token=None, password_reset_token_expiry=None)
    
    logger.info(f"{activation_count} expired activation tokens and {reset_count} expired reset tokens deleted at {now}")
    return f"{activation_count} activation, {reset_count} reset tokens deleted"