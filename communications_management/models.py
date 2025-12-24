# communication_management/models.py
"""
Modèles pour la gestion des annonces
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone

class Announcement(models.Model):
    """
    Modèle pour les annonces de la plateforme
    """
    
    class Priority(models.TextChoices):
        LOW = 'low', _('Basse')
        MEDIUM = 'medium', _('Moyenne')
        HIGH = 'high', _('Haute')
        URGENT = 'urgent', _('Urgente')
    
    title = models.CharField(
        _('titre'),
        max_length=200,
        help_text=_("Titre de l'annonce")
    )
    
    content = models.TextField(
        _('contenu'),
        help_text=_("Contenu détaillé de l'annonce")
    )
    
    publication_date = models.DateTimeField(
        _('date de publication'),
        default=timezone.now,
        help_text=_("Date et heure de publication de l'annonce")
    )
    
    priority = models.CharField( 
        _('priorité'),
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        help_text=_("Niveau de priorité de l'annonce")
    )
    
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_("Indique si l'annonce est visible sur la plateforme")
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='announcements_created',
        verbose_name=_('créé par')
    )
    
    created_at = models.DateTimeField(
        _('date de création'),
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        _('date de modification'),
        auto_now=True
    )

    class Meta:
        verbose_name = _('annonce')
        verbose_name_plural = _('annonces')
        ordering = ['-publication_date', '-priority']
        indexes = [
            models.Index(fields=['publication_date', 'is_active']),
            models.Index(fields=['priority', 'is_active']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"

    @property
    def is_published(self):
        """Vérifie si l'annonce est publiée et active"""
        return self.is_active and self.publication_date <= timezone.now()

    def can_view(self, user):
        """
        Détermine si un utilisateur peut voir cette annonce
        Tous les utilisateurs authentifiés peuvent voir les annonces publiées
        """
        if not user.is_authenticated:
            return False
        return self.is_published

    def can_edit(self, user):
        """
        Détermine si un utilisateur peut modifier cette annonce
        Seuls les admins peuvent modifier les annonces
        """
        return user.is_authenticated and user.role == 'admin'

    def can_delete(self, user):
        """
        Détermine si un utilisateur peut supprimer cette annonce
        Seuls les admins peuvent supprimer les annonces
        """
        return user.is_authenticated and user.role == 'admin'