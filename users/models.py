"""users/models.py
Ce module définit les modèles principaux pour la gestion des utilisateurs, profils et 
suggestions dans l'application.
Contenu principal :
------------------
- Génération sécurisée de mots de passe temporaires.
- Gestionnaire personnalisé d'utilisateurs (`CustomUserManager`) avec création d'utilisateurs, 
superutilisateurs, et création massive atomique.
- Modèle `User` : utilisateur personnalisé avec gestion avancée de l'activation, des rôles, de l'expiration et du renouvellement de mot de passe.
- Modèle `Profile` : informations complémentaires liées à chaque utilisateur (adresse, profession, filière, etc.).
- Modèle `Suggestion` : suggestions de domaines de stage par les utilisateurs ou anonymes.
- Signaux Django pour assurer la création automatique des profils et la validation métier avant sauvegarde.
Points clés :
-------------
- Les emails sont uniques et insensibles à la casse.
- Les utilisateurs inactifs reçoivent un token d'activation avec expiration.
- Les mots de passe temporaires sont générés de façon sécurisée et expirent sous 24h.
- Les rôles utilisateurs sont strictement contrôlés (admin, supervisor, intern, visitor).
- Les profils sont créés automatiquement à la création d'un utilisateur.
- Les suggestions sont historisées avec date de création.
- Les opérations critiques (création massive, envoi d'emails) sont logguées et gérées de façon robuste.
Utilisation : 
-------------
Ce module est destiné à être utilisé comme backend pour la gestion des comptes utilisateurs, avec intégration possible dans une API REST (Django REST Framework)."""
import logging

import random
import re
import string
import uuid
from datetime import timedelta
from .tasks import send_activation_email

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.db import models, transaction, IntegrityError
from django.db.models import Q
from django.db.models.functions import Lower
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.timezone import now
from users.mixins import LoggingMixin, RateLimitMixin

logger = logging.getLogger(__name__)

def generate_secure_temp_password(length: int = 12) -> str:
    """
    Generate a cryptographically secure temporary password including:
    - at least one letter, one digit, and one symbol
    - length >= 12
    """
    chars = string.ascii_letters + string.digits + string.punctuation
    rng = random.SystemRandom()
    while True:
        pw = ''.join(rng.choice(chars) for _ in range(length))
        if re.search(r'[A-Za-z]', pw) and re.search(r'\d', pw) and re.search(r'\W', pw):
            return pw


class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def _init_activation(self, user, hours: int = 48):
        user.activation_token = uuid.uuid4()
        user.activation_token_expiry = timezone.now() + timedelta(hours=hours)

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set.')
        email = self.normalize_email(email)
        # Default: new users require activation
        extra_fields.setdefault('is_active', False)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
            user.must_change_password = False
        else:
            temp_password = generate_secure_temp_password()
            user.set_password(temp_password)
            user.must_change_password = True
            user.password_expiry = timezone.now() + timedelta(hours=24)
            logger.info(f"Generated temporary password for {email} (not logged).")
        # Ensure activation token for all non-active users
            if not user.is_active and user.role != 'visitor':
                send_activation_email.delay(
                    user.email,
                    user.first_name,
                    str(user.activation_token),
                    user.activation_token_expiry.isoformat(),
                    user.password_expiry.isoformat()
                )
        # Activation token for all non-active users
        if not user.is_active:
            self._init_activation(user)

        user.save(using=self._db)
        return user
    

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)




    @transaction.atomic
    def bulk_create_users(self, user_data_list, activation_hours: int = 48):
        """
        Crée efficacement plusieurs utilisateurs en masse en une opération atomique.

        Fonctionnalités améliorées :
        - Validation stricte de l'email (et unicité intra-batch).
        - Génération sécurisée de mots de passe temporaires avec expiration.
        - Initialisation de tokens d’activation pour les comptes inactifs.
        - Création optimisée avec `bulk_create`.
        - Envoi asynchrone des emails d’activation.
        - Audit logging complet via LoggingMixin.
        """

        # Rate limiting : protège contre spam/création massive abusive
        allowed, rate_info = self.check_rate_limit(None, action='bulk_create_users')
        if not allowed:
            self.log_security_event('bulk_create_rate_limited', rate_info)
            raise ValidationError("Trop de requêtes, réessayez plus tard.")

        users_to_create = []
        emails_seen = set()

        for idx, data in enumerate(user_data_list, start=1):
            email = data.get('email')
            if not email:
                self.log_error(
                    'bulk_create_missing_email',
                    ValidationError("Email manquant"),
                    {'line': idx}
                )
                continue

            normalized_email = self.normalize_email(email)
            if normalized_email in emails_seen:
                self.log_error(
                    'bulk_create_duplicate_email_in_batch',
                    ValidationError("Doublon dans le batch"),
                    {'line': idx, 'email': normalized_email}
                )
                continue

            emails_seen.add(normalized_email)

            password = data.pop('password', None) or generate_secure_temp_password()
            data.setdefault('is_active', False)

            user = self.model(email=normalized_email, **data)
            user.set_password(password)
            user.must_change_password = True
            user.password_expiry = now() + timedelta(hours=24)

            if not user.is_active:
                user.activation_token = uuid.uuid4()
                user.activation_token_expiry = now() + timedelta(hours=activation_hours)

            users_to_create.append(user)

        if not users_to_create:
            self.log_action('bulk_create_no_valid_users', 'warning', details={})
            return []

        try:
            self.bulk_create(users_to_create, ignore_conflicts=False)
        except IntegrityError as e:
            self.log_error('bulk_create_db_integrity_error', e)
            raise

        # Rafraîchir pour récupérer IDs
        for user in users_to_create:
            user.refresh_from_db()

        self.log_success('bulk_create_completed', {
            'created_count': len(users_to_create)
        })

        # Envoi des emails asynchrones
        for user in users_to_create:
            if user.role != 'visitor':
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

        return users_to_create

class ActiveUserManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True, deleted_at__isnull=True)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('supervisor', 'Maitre de suivi'),
        ('intern', 'Stagiaire'),
        ('visitor', 'Visiteur simple'),
    )

    email = models.EmailField(unique=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_activated_at = models.DateTimeField(null=True, blank=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        help_text="Numéro de téléphone",
        validators=[RegexValidator(r'^\+?\d{9,15}$', 'Format de téléphone invalide. Ex: +22670000000')],
    )
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='visitor')
    date_joined = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.CharField(max_length=255, null=True, blank=True)

    # Password lifecycle
    password_expiry = models.DateTimeField(null=True, blank=True, help_text="Date d'expiration du mot de passe")
    must_change_password = models.BooleanField(default=False)

    # Activation and reset flows
    activation_token = models.UUIDField(null=True, blank=True)
    activation_token_expiry = models.DateTimeField(null=True, blank=True)
    password_reset_token = models.UUIDField(null=True, blank=True, unique=True)
    password_reset_token_expiry = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()
    active_objects = ActiveUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        constraints = [
            # Case-insensitive unique email
            models.UniqueConstraint(Lower('email'), name='uniq_user_email_ci'),
            # Admin must be staff
            models.CheckConstraint(
                condition=Q(role='admin', is_staff=True) | ~Q(role='admin'),
                name='admin_requires_staff',
            ),
        ]
        indexes = [
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_permissions(self):
        """
        Return permission set according to user role.
        """
        from users.permissions import (
            ADMIN_PERMISSIONS, SUPERVISOR_PERMISSIONS, INTERN_PERMISSIONS, BASIC_USER_PERMISSIONS
        )
        if self.role == 'admin':
            return ADMIN_PERMISSIONS
        if self.role == 'supervisor':
            return SUPERVISOR_PERMISSIONS
        if self.role == 'intern':
            return INTERN_PERMISSIONS
        return BASIC_USER_PERMISSIONS

    def regenerate_activation_token(self, hours: int = 48):
        self.activation_token = uuid.uuid4()
        self.activation_token_expiry = timezone.now() + timedelta(hours=hours)
        self.save(update_fields=['activation_token', 'activation_token_expiry'])

    def is_activation_token_valid(self, token) -> bool:
        return (
            self.activation_token == token
            and self.activation_token_expiry is not None
            and timezone.now() < self.activation_token_expiry
            and not self.is_active
        )

    def generate_password_reset_token(self, expiry_hours: int = 1):
        self.password_reset_token = uuid.uuid4()
        self.password_reset_token_expiry = timezone.now() + timedelta(hours=expiry_hours)
        self.save(update_fields=['password_reset_token', 'password_reset_token_expiry'])
        logger.info(f"Password reset token generated for {self.email}")
        return self.password_reset_token

    def clear_password_reset_token(self):
        self.password_reset_token = None
        self.password_reset_token_expiry = None
        self.save(update_fields=['password_reset_token', 'password_reset_token_expiry'])

    def is_password_reset_token_valid(self, token) -> bool:
        return (
            self.password_reset_token == token
            and self.password_reset_token_expiry is not None
            and timezone.now() < self.password_reset_token_expiry
        )

    def is_password_expired(self) -> bool:
        return bool(self.password_expiry and timezone.now() > self.password_expiry)

    def soft_delete(self, deleted_by_email):
        self.is_active = False
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by_email
        self.email = f"deleted_{self.pk}@removed.local"
        self.save(update_fields=['is_active', 'deleted_at', 'deleted_by', 'email'])

    def restore(self):
        self.is_active = True
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_active', 'deleted_at', 'deleted_by'])

    def clean(self):
        """
        Model-level validation for role-profile requirements.
        """
        if hasattr(self, 'profile'):
            if self.role == 'supervisor' and not self.profile.profession:
                raise ValidationError('Supervisors must have a profession set in their profile.')
            if self.role == 'intern' and not self.profile.filiere:
                raise ValidationError('Interns must have a filiere set in their profile.')

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.__class__.objects.normalize_email(self.email)
        if not self.pk and not self.is_active:
            if not self.activation_token:
                self.activation_token = uuid.uuid4()
            if not self.activation_token_expiry:
                self.activation_token_expiry = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    address = models.CharField(max_length=255, blank=True, help_text="Adresse")
    profession = models.CharField(max_length=100, blank=True, help_text="Profession ou spécialité (supervisor)")
    specialty = models.CharField(max_length=100, blank=True, help_text="Spécialité dans un domaine d'étude")
    university_teaches = models.CharField(max_length=100, blank=True, help_text="Université où il enseigne")
    filiere = models.CharField(max_length=100, blank=True, help_text="Filière (intern)")
    domain_study = models.CharField(max_length=100, blank=True, help_text="Domaine d'étude")
    university_studies = models.CharField(max_length=100, blank=True, help_text="Université où il étudie")
    age = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(16), MaxValueValidator(100)],
        help_text="Âge",
    )

    def __str__(self):
        return f"Profile for {self.user.email}"

    class Meta:
        indexes = [
            models.Index(fields=['university_studies']),
            models.Index(fields=['domain_study']),
        ]


class Suggestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    domain_suggested = models.CharField(max_length=100, help_text="Domaine de stage suggéré")
    message = models.TextField(blank=True, help_text="Suggestions supplémentaires")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        who = self.user.email if self.user else 'Anonymous'
        return f"Suggestion from {who}"

    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
        ]



# Signals: consistent lifecycle for profiles

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        try:
            Profile.objects.create(user=instance)
            logger.info(f"Created profile for new user {instance.email}")
        except Exception as e:
            logger.error(f"Failed to create profile for user {instance.email}: {e}")

@receiver(pre_save, sender=User)
def validate_user_before_save(sender, instance, raw=False, **kwargs):
    # Run model-level validation (surfaced better via serializers in API)
    if not raw:
        instance.clean()
