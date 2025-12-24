from django.db import models
from django.core.exceptions import ValidationError
import uuid


def project_file_upload_path(instance, filename):
    """Chemin d'upload pour les fichiers de projet"""
    ext = filename.rsplit('.', 1)[-1].lower()
    new_filename = f"{uuid.uuid4()}.{ext}"
    return f"projects/{new_filename}"


class Projet(models.Model):
    """
    Représente un projet lié à une formation.
    """
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
    ]

    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    objectifs = models.TextField(blank=True)
    
    statut = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='en_attente'
    )
    
    # Relation
    formation = models.ForeignKey(
        'training_management.FormationType',
        on_delete=models.CASCADE, 
        related_name='projets'
    )
    
    # Fichier optionnel
    fichier = models.FileField(
        upload_to=project_file_upload_path,
        blank=True,
        null=True
    )
    
    # Dates
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Projet"
        verbose_name_plural = "Projets"

    def __str__(self):
        return self.titre

    def clean(self):
        """Validation : date_fin doit être après date_debut"""
        if self.date_debut and self.date_fin:
            if self.date_fin < self.date_debut:
                raise ValidationError({
                    'date_fin': "La date de fin doit être après la date de début."
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)