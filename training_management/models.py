from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

class FormationType(models.Model):
    """
    Définit le modèle de base d'une formation (ex: MS Office, QGIS).
    Utilisé pour le catalogue permanent.
    """
    nom = models.CharField(max_length=200, unique=True, help_text="Nom unique de la formation")
    description = models.TextField(blank=True, help_text="Description détaillée de la formation")
    duree_estimee = models.PositiveIntegerField(
        help_text="Durée standard en heures (doit être positif)"
    )
    est_actif = models.BooleanField(
        default=True,
        help_text="Indique si la formation est active et visible dans le catalogue"
    )
    def nombre_sessions(self):
        """Compteur mis en cache pour éviter N+1 queries"""
        if hasattr(self, '_nombre_sessions_cache'):
            return self._nombre_sessions_cache
        count = self.sessions.count()  # related_name='sessions' dans FormationSession
        self._nombre_sessions_cache = count
        return count
    
    class Meta:
        verbose_name = "Modèle de Formation"
        verbose_name_plural = "Catalogue Permanent"
        ordering = ['nom']

    def __str__(self):
        return self.nom

    def clean(self):
        """Valider que la durée estimée est positive."""
        if self.duree_estimee <= 0:
            raise ValidationError("La durée estimée doit être supérieure à 0.")


class SupportFormation(models.Model):
    """
    Supports de cours associés à une formation (PDF, PowerPoint, etc.)
    """
    formation_type = models.ForeignKey(
        FormationType, 
        on_delete=models.CASCADE, 
        related_name='supports',
        help_text="Formation à laquelle ce support appartient"
    )
    fichier = models.FileField(
        upload_to='supports_formation/%Y/%m/%d/',
        help_text="Fichier support (PDF, PPT, DOC, etc.)"
    )
    titre = models.CharField(max_length=200, help_text="Titre du support")
    description = models.TextField(blank=True, help_text="Description du support")
    type_support = models.CharField(
        max_length=50,
        choices=[
            ('PDF', 'Document PDF'),
            ('PPT', 'Présentation PowerPoint'),
            ('DOC', 'Document Word'),
            ('EXCEL', 'Fichier Excel'),
            ('VIDEO', 'Vidéo'),
            ('AUTRE', 'Autre'),
        ],
        default='PDF',
        help_text="Type de support"
    )
    date_ajout = models.DateTimeField(auto_now_add=True)

    
    
    class Meta:
        verbose_name = "Support de Formation"
        verbose_name_plural = "Supports de Formation"
        ordering = ['formation_type', 'titre']

    def __str__(self):
        return f"{self.formation_type.nom} - {self.titre}"

    def extension_fichier(self):
        """Retourne l'extension du fichier"""
        import os
        return os.path.splitext(self.fichier.name)[1].upper()

    def taille_fichier(self):
        """Retourne la taille du fichier en format lisible"""
        try:
            size = self.fichier.size
            if size < 1024:
                return f"{size} octets"
            elif size < 1024 * 1024:
                return f"{size / 1024:.1f} KB"
            else:
                return f"{size / (1024 * 1024):.1f} MB"
        except (ValueError, OSError):
            return "Inconnue"


class FormationSession(models.Model):
    """
    Représente une instance planifiée d'une formation du catalogue.
    Apparaît dans le calendrier avec un statut dynamique.
    """
    formation_type = models.ForeignKey(
        FormationType, 
        on_delete=models.CASCADE,
        related_name='sessions',
        help_text="Formation du catalogue associée"
    )
    date_debut = models.DateTimeField(help_text="Date et heure de début de la session")
    date_fin = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="Date et heure de fin de la session (facultatif)"
    )
    formateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='formations_dirigees',
        limit_choices_to={'role': 'intern'},
        help_text="Formateur (rôle intern)"
    )

    STATUT_CHOICES = [
        ('PLAN', 'Planifiée'),
        ('ENCOURS', 'En Cours'),
        ('TERMINEE', 'Terminée'),
    ]
    statut = models.CharField(
        max_length=8,
        choices=STATUT_CHOICES, 
        default='PLAN',
        help_text="Statut actuel de la session"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date_debut']
        verbose_name = "Session de Formation"
        verbose_name_plural = "Sessions de Formation"

    def __str__(self):
        return f"{self.formation_type.nom} ({self.date_debut.strftime('%Y-%m-%d')})"

    def clean(self):
        """Valider que date_fin >= date_debut si date_fin est défini."""
        if self.date_fin and self.date_debut and self.date_fin < self.date_debut:
            raise ValidationError("La date de fin doit être postérieure ou égale à la date de début.")
    
    def calculer_duree(self):  # ← nouveau nom clair
        if self.date_debut and self.date_fin:
            duree = self.date_fin - self.date_debut
            return round(duree.total_seconds() / 3600, 2)
        return 0

    # Et ajoute une propriété
    @property
    def duree_calculee(self):
        return self.calculer_duree()

    def est_passee(self):
        """Vérifie si la session est passée"""
        now = timezone.now()
        return self.date_fin and now > self.date_fin

    def est_en_cours(self):
        """Vérifie si la session est en cours"""
        now = timezone.now()
        return (self.date_debut and self.date_fin and 
                self.date_debut <= now <= self.date_fin)

    def est_a_venir(self):
        """Vérifie si la session est à venir"""
        now = timezone.now()
        return self.date_debut and now < self.date_debut
    
    def update_statut(self):
        """Mettre à jour le statut en fonction des dates."""
        now = timezone.now()
        if self.date_fin and now > self.date_fin:
            self.statut = 'TERMINEE'
        elif self.date_debut and now >= self.date_debut:
            self.statut = 'ENCOURS'
        else:
            self.statut = 'PLAN'
        self.save()