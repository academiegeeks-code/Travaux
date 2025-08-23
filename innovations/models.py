# innovation/models.py
from django.db import models
from users.models import User

# Modèles pour les données structurées
class Universite(models.Model):
    nom = models.CharField(max_length=200, unique=True)
    def __str__(self):
        return self.nom

class Domaine(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nom

class Theme(models.Model):
    titre = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    domaine = models.ForeignKey(Domaine, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return self.titre

class Projet(models.Model):
    STATUT_CHOICES = (
        ('EN_COURS', 'En Cours'),
        ('EN_ATTENTE_VALIDATION', 'En Attente de Validation'),
        ('TERMINE', 'Terminé'),
        ('ARCHIVE', 'Archivé'),
    )
    
    stagiaire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projets_stagiaire')
    maitre_de_suivi = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='projets_supervises')
    theme = models.OneToOneField(Theme, on_delete=models.CASCADE)
    statut = models.CharField(max_length=50, choices=STATUT_CHOICES, default='EN_COURS')
    date_debut = models.DateField(auto_now_add=True)
    date_fin_prevue = models.DateField()
    
    def __str__(self):
        return f"Projet de {self.stagiaire.get_full_name()}: {self.theme.titre}"

class Document(models.Model):
    titre = models.CharField(max_length=255)
    fichier = models.FileField(upload_to='documents/')
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='documents')
    version_number = models.IntegerField(default=1)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.titre

class Annotation(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='annotations')
    auteur = models.ForeignKey(User, on_delete=models.CASCADE)
    contenu = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

class SujetFormation(models.Model):
    titre = models.CharField(max_length=255)
    description = models.TextField()
    
    def __str__(self):
        return self.titre

class VagueDeFormation(models.Model):
    nom = models.CharField(max_length=100)
    stagiaires = models.ManyToManyField(User, related_name='vagues_formation')
    sujets_formation = models.ManyToManyField(SujetFormation)
    date_debut = models.DateField()
    date_fin_prevue = models.DateField()
    
    def __str__(self):
        return self.nom