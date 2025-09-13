"""users/models.py
Modèles pour la gestion des utilisateurs, profils et suggestions.
"""
import logging
import random
import re
import string
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.db import models, transaction
from django.db.models import Q
from django.db.models.functions import Lower
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

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

class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Crée et enregistre un utilisateur avec l'email et mot de passe donnés."""
        if not email:
            raise ValueError('The given email must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        
        if password:
            user.set_password(password)
            user.password_expiry = timezone.now() + timedelta(hours=24)  # ← Expiration dans 90 jours
        else:
            # Générer un mot de passe temporaire
            temp_password = generate_secure_temp_password()
            user.set_password(temp_password)
            user.must_change_password = True
            user.password_expiry = timezone.now() + timedelta(hours=24)
            logger.info(f"Generated temporary password for {email}")
        
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_active', False)
        
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)

class ActiveUserManager(models.Manager):
    """Manager pour les utilisateurs actifs non supprimés."""
    def get_queryset(self):
        return super().get_queryset().filter(
            is_active=True, 
            deleted_at__isnull=True
        )

class User(AbstractUser):
    """Modèle utilisateur personnalisé."""

    def get_permissions(self):
        from .permissions import ADMIN_PERMISSIONS, INTERN_PERMISSIONS, SUPERVISOR_PERMISSIONS, BASIC_USER_PERMISSIONS

        # Exemple basé sur le rôle
        if self.role == 'admin':
            return ADMIN_PERMISSIONS
        elif self.role == 'intern':
            return INTERN_PERMISSIONS
        elif self.role == 'supervisor':
            return SUPERVISOR_PERMISSIONS
        else:
            return BASIC_USER_PERMISSIONS
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Actif'
        INACTIVE = 'inactive', 'Inactif'
        SUSPENDED = 'suspended', 'Suspendu'
    
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('supervisor', 'Maître de stage'),
        ('intern', 'Stagiaire'),
        ('visitor', 'Visiteur'),
    )

    # Email comme identifiant principal. Utiliser username pour l'Auth est absurde !
    username = models.CharField(
        _("username"), 
        max_length=150, 
        blank=True,
        null=True,
        help_text=_("150 characters or fewer. Letters, digits and @/./+/-/_ only."),
    )
    email = models.EmailField(_('email address'), unique=True)
    
    # Champs supplémentaires
    last_login_ip = models.GenericIPAddressField(_('last login IP'), null=True, blank=True)
    last_activity = models.DateTimeField(_('last activity'), null=True, blank=True)
    phone_number = models.CharField(
        _('phone number'),
        max_length=15,
        blank=True,
        validators=[RegexValidator(r'^\+?\d{9,15}$', 'Format de téléphone invalide.')],
    )
    """Champs pour traquer la completion des profils utilisateurs. Les données d'utilisateurs sont
      importantes et la plateforme doit accelerer l'innovation a BCEF  """
    # Suivi du profil
    is_profile_complete = models.BooleanField(_('profile complete'), default=False)
    profile_completion_reminders = models.PositiveIntegerField(_('profile reminders'), default=0)
    last_profile_reminder = models.DateTimeField(_('last profile reminder'), null=True, blank=True)

    
    # Gestion des rôles et statuts
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES, default='visitor')
    status = models.CharField(_('status'), max_length=20, choices=Status.choices, default=Status.INACTIVE)
    
    # Gestion de la suppression
    deleted_at = models.DateTimeField(_('deleted at'), null=True, blank=True)
    deleted_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='deleted_users'
    )
    
    # Cycle de vie du mot de passe
    password_expiry = models.DateTimeField(_('password expiry'), null=True, blank=True)
    must_change_password = models.BooleanField(_('must change password'), default=False)
    
    # Tokens d'activation et réinitialisation
    activation_token = models.UUIDField(_('activation token'), null=True, blank=True)
    activation_token_expiry = models.DateTimeField(_('activation token expiry'), null=True, blank=True)
    password_reset_token = models.UUIDField(_('password reset token'), null=True, blank=True)
    password_reset_token_expiry = models.DateTimeField(_('password reset token expiry'), null=True, blank=True)

    # Managers
    objects = CustomUserManager()
    active_objects = ActiveUserManager()

    # Utiliser email comme champ d'authentification principal
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] if not getattr(settings, 'REMOVE_USERNAME_FIELD', False) else []

    class Meta:
        constraints = [
            models.UniqueConstraint(
                Lower('email'), 
                name='uniq_user_email_ci'
            ),
            models.CheckConstraint(
                check=Q(role='admin', is_staff=True) | ~Q(role='admin'),
                name='admin_requires_staff',
            ),
        ]
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
            models.Index(fields=['date_joined']),
            models.Index(fields=['role', 'is_active']),
        ]
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        """Pré-processing avant sauvegarde."""
        if self.email:
            self.email = self.__class__.objects.normalize_email(self.email)
        
        # Générer un username à partir de l'email si non fourni
        if not self.username and self.email:
            self.username = self.email.split('@')[0]
            
        # Générer un token d'activation pour les nouveaux utilisateurs inactifs
        if not self.pk and not self.is_active and not self.activation_token:
            self.activation_token = uuid.uuid4()
            self.activation_token_expiry = timezone.now() + timedelta(hours=48)
            
        super().save(*args, **kwargs)

    def clean(self):
        """Validation métier."""
        super().clean()
        
        # Validation spécifique au rôle
        if hasattr(self, 'profile'):
            if self.role == 'supervisor' and not self.profile.profession:
                raise ValidationError({'profession': _('Supervisors must have a profession.')})
            if self.role == 'intern' and not self.profile.filiere:
                raise ValidationError({'filiere': _('Interns must have a field of study.')})

    @property
    def full_name(self):
        """Retourne le nom complet."""
        return f"{self.first_name} {self.last_name}".strip()

    def get_permissions(self):
            """
            Accorder les permissions en fonction du role de l'utilisateur
            """
            #A partir des permissions, importer les permissions de chaque rôle
            from user_management.permissions import (
                ADMIN_PERMISSIONS, SUPERVISOR_PERMISSIONS, INTERN_PERMISSIONS, BASIC_USER_PERMISSIONS
            )
            #Si le role est admin, lui accorder toutes les permissions de Admin; ainsi de suite (...)
            if self.role == 'admin':
                return ADMIN_PERMISSIONS
            if self.role == 'supervisor':
                return SUPERVISOR_PERMISSIONS
            if self.role == 'intern':
                return INTERN_PERMISSIONS
            #Sinon les seules permissions accordées sont celles basiques (pour les visiteurs)
            return BASIC_USER_PERMISSIONS

    def is_activation_token_valid(self, token):
        """Vérifie si le token d'activation est valide."""
        return (
            self.activation_token == token and
            self.activation_token_expiry and
            timezone.now() < self.activation_token_expiry and
            not self.is_active
        )

    def generate_password_reset_token(self, expiry_hours=1):
        """Génère un token de réinitialisation de mot de passe."""
        self.password_reset_token = uuid.uuid4()
        self.password_reset_token_expiry = timezone.now() + timedelta(hours=expiry_hours)
        self.save(update_fields=['password_reset_token', 'password_reset_token_expiry'])
        return self.password_reset_token

    def is_password_reset_token_valid(self, token):
        """Vérifie si le token de réinitialisation est valide."""
        return (
            self.password_reset_token == token and
            self.password_reset_token_expiry and
            timezone.now() < self.password_reset_token_expiry
        )

    def is_password_expired(self):
        """Vérifie si le mot de passe a expiré."""
        return self.password_expiry and timezone.now() > self.password_expiry

    def soft_delete(self, deleted_by):
        """Suppression douce de l'utilisateur."""
        self.is_active = False
        self.status = self.Status.INACTIVE
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=['is_active', 'status', 'deleted_at', 'deleted_by'])

    def restore(self):
        """Restauration d'un utilisateur supprimé."""
        self.is_active = True
        self.status = self.Status.ACTIVE
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_active', 'status', 'deleted_at', 'deleted_by'])

class Profile(models.Model):
    """Profil étendu pour les utilisateurs."""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    address = models.CharField(_('address'), max_length=255, blank=True)
    profession = models.CharField(_('profession'), max_length=100, blank=True)
    specialty = models.CharField(_('specialty'), max_length=100, blank=True)
    university_teaches = models.CharField(_('teaching university'), max_length=100, blank=True)
    filiere = models.CharField(_('field of study'), max_length=100, blank=True)
    domain_study = models.CharField(_('domain of study'), max_length=100, blank=True)
    university_studies = models.CharField(_('studying university'), max_length=100, blank=True)
    age = models.PositiveIntegerField(
        _('age'),
        null=True, 
        blank=True,
        validators=[MinValueValidator(16), MaxValueValidator(100)]
    )

    class Meta:
        verbose_name = _('profile')
        verbose_name_plural = _('profiles')
        indexes = [
            models.Index(fields=['university_studies']),
            models.Index(fields=['domain_study']),
        ]

    def __str__(self):
        return _("Profile for %(email)s") % {'email': self.user.email}

class Suggestion(models.Model):
    """Suggestions de domaines de stage."""
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    email = models.EmailField(_('email'))
    domain_suggested = models.CharField(_('suggested domain'), max_length=100)
    message = models.TextField(_('message'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('suggestion')
        verbose_name_plural = _('suggestions')
        indexes = [
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        if self.user:
            return _("Suggestion from %(email)s") % {'email': self.user.email}
        return _("Anonymous suggestion")

# Signaux
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Crée un profil automatiquement à la création d'un utilisateur."""
    if created and not hasattr(instance, 'profile'):
        Profile.objects.create(user=instance)
        logger.info(f"Created profile for user {instance.email}")

@receiver(pre_save, sender=User)
def user_pre_save(sender, instance, **kwargs):
    """Validation avant sauvegarde de l'utilisateur."""
    # Assure que l'email est normalisé
    if instance.email:
        instance.email = instance.__class__.objects.normalize_email(instance.email)