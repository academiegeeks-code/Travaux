# internship_management/models.py
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.db.models import Q
from user_management.models import User


class ThemeQuerySet(models.QuerySet):
    def available(self):
        return self.filter(status=Theme.Status.NOT_ASSIGNED, is_active=True)

    def assigned(self):
        return self.filter(status=Theme.Status.ASSIGNED)

    def active(self):
        return self.filter(is_active=True)

    def recent(self, days=7):
        delta = timezone.now() - timezone.timedelta(days=days)
        return self.filter(created_date__gte=delta)


class ThemeManager(models.Manager):
    def get_queryset(self):
        return ThemeQuerySet(self.model, using=self._db)

    def available(self):
        return self.get_queryset().available()

    def assigned(self):
        return self.get_queryset().assigned()

    def active(self):
        return self.get_queryset().active()

    def recent(self, days=7):
        return self.get_queryset().recent(days=days)


class Theme(models.Model):
    class Status(models.TextChoices):
        NOT_ASSIGNED = 'non_attribue', _('Non attribué')
        ASSIGNED = 'attribue', _('Attribué')

    # === Champs principaux ===
    title = models.CharField(
        _('titre'),
        max_length=200,
        unique=True,
        help_text=_("Titre unique du thème de stage")
    )
    description = models.TextField(
        _('description'),
        max_length=1000,
        help_text=_("Description détaillée du thème")
    )
    created_date = models.DateTimeField(_('date de création'), auto_now_add=True)
    assignment_date = models.DateTimeField(
        _("date d'attribution"),
        null=True,
        blank=True,
    )
    status = models.CharField(
        _('statut'),
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_ASSIGNED
    )
    is_active = models.BooleanField(_('actif'), default=True)

    # Manager personnalisé
    objects = ThemeManager()

    class Meta:
        verbose_name = _('thème')
        verbose_name_plural = _('thèmes')
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_date']),
            models.Index(fields=['status', 'is_active']),
        ]

    def __str__(self):
        return self.title

    # Accès au stagiaire via la relation inverse depuis User
    @property
    def assigned_to(self):
        """Retourne le stagiaire assigné (via la relation inverse du OneToOne)"""
        try:
            return self.assigned_intern  # related_name dans User.assigned_theme
        except User.DoesNotExist:
            return None

    def clean(self):
        # On utilise la propriété assigned_to qui passe par la relation inverse
        if self.status == self.Status.ASSIGNED:
            if not self.assigned_to:
                raise ValidationError(_("Un thème attribué doit avoir un stagiaire."))
            if not self.assignment_date:
                raise ValidationError(_("Un thème attribué doit avoir une date."))
        if self.status == self.Status.NOT_ASSIGNED:
            if self.assigned_to:
                raise ValidationError(_("Un thème non attribué ne peut pas avoir de stagiaire."))
        if self.assigned_to and self.assigned_to.role != 'intern':
            raise ValidationError(_("Seuls les stagiaires peuvent avoir un thème."))

    def save(self, *args, **kwargs):
        self.full_clean()
        # Auto-sync du statut basé sur la relation inverse
        has_intern = self.assigned_to is not None
        if has_intern and self.status == self.Status.NOT_ASSIGNED:
            self.status = self.Status.ASSIGNED
            if not self.assignment_date:
                self.assignment_date = timezone.now()
        elif not has_intern and self.status == self.Status.ASSIGNED:
            self.status = self.Status.NOT_ASSIGNED
            self.assignment_date = None
        super().save(*args, **kwargs)

    def assign_to_intern(self, intern, assignment_date=None):
        if intern.role != 'intern':
            raise ValidationError(_("Seuls les stagiaires peuvent recevoir un thème."))
        if intern.assigned_theme is not None:
            raise ValidationError(_("Ce stagiaire a déjà un thème attribué."))

        # On assigne via le OneToOneField côté User
        intern.assigned_theme = self
        intern.save()

        self.assignment_date = assignment_date or timezone.now()
        self.status = self.Status.ASSIGNED
        self.save()

    def unassign(self):
        if self.assigned_to:
            self.assigned_to.assigned_theme = None
            self.assigned_to.save()

        self.assignment_date = None
        self.status = self.Status.NOT_ASSIGNED
        self.save()

    @property
    def is_assignable(self):
        return self.is_active and self.status == self.Status.NOT_ASSIGNED

    @property
    def days_since_creation(self):
        return (timezone.now() - self.created_date).days

    @property
    def days_since_assignment(self):
        if self.assignment_date:
            return (timezone.now() - self.assignment_date).days
        return None