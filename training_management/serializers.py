from rest_framework import serializers
from django.conf import settings
from django.utils import timezone
from .models import FormationType, FormationSession, SupportFormation
from user_management.models import User

class FormationTypeSerializer(serializers.ModelSerializer):
    nombre_sessions = serializers.ReadOnlyField()
    supports_count = serializers.SerializerMethodField()  # Nouveau champ
    class Meta:
        model = FormationType
        fields = ['id', 'nom', 'description', 'duree_estimee', 'est_actif', 'nombre_sessions', 'supports_count']

    def get_supports_count(self, obj):
        """Retourne le nombre de supports pour cette formation"""
        return obj.supports.count()
    
    def validate_duree_estimee(self, value):
        """Validation de la durée estimée"""
        if value <= 0:
            raise serializers.ValidationError("La durée estimée doit être supérieure à 0.")
        return value


class SupportFormationSerializer(serializers.ModelSerializer):
    extension_fichier = serializers.ReadOnlyField()
    taille_fichier = serializers.ReadOnlyField()
    formation_type_nom = serializers.CharField(source='formation_type.nom', read_only=True)
    
    class Meta:
        model = SupportFormation
        fields = [
            'id', 'formation_type', 'formation_type_nom', 'fichier', 
            'titre', 'description', 'type_support', 'extension_fichier', 
            'taille_fichier', 'date_ajout'
        ]
        read_only_fields = ['date_ajout', 'extension_fichier', 'taille_fichier']

    def validate(self, data):
        """Validation globale"""
        # Vérifier que formation_type est fourni
        if 'formation_type' not in data:
            raise serializers.ValidationError({
                "formation_type": "Le type de formation est obligatoire."
            })
        
        return data

    def validate_fichier(self, value):
        """Validation du fichier"""
        if value:
            # Utilisation de la limite depuis les settings avec fallback
            max_size = getattr(settings, 'MAX_SUPPORT_SIZE', 10 * 1024 * 1024)  # 10MB par défaut
            
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"Le fichier ne doit pas dépasser {max_size / (1024 * 1024)}MB."
                )
            
            # Vérifier les extensions autorisées
            allowed_extensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.mp4']
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError(
                    f"Type de fichier non autorisé. Extensions acceptées: {', '.join(allowed_extensions)}"
                )
        return value

    def create(self, validated_data):
        """Création avec gestion des erreurs"""
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(
                f"Erreur lors de la création du support: {str(e)}"
            )

    def update(self, instance, validated_data):
        """Surcharge pour gérer la suppression de l'ancien fichier"""
        old_file = instance.fichier
        
        # Mise à jour normale
        instance = super().update(instance, validated_data)
        
        # Si le fichier a changé, supprimer l'ancien
        if 'fichier' in validated_data and old_file and old_file != instance.fichier:
            old_file.delete(save=False)
            
        return instance

class FormationTypeDetailSerializer(FormationTypeSerializer):
    """Serializer détaillé avec les supports"""
    supports = SupportFormationSerializer(many=True, read_only=True)
    
    class Meta(FormationTypeSerializer.Meta):
        fields = FormationTypeSerializer.Meta.fields + ['supports']


class FormationSessionListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des sessions (optimisé)"""
    formation_type_nom = serializers.CharField(source='formation_type.nom', read_only=True)
    formateur_nom = serializers.CharField(source='formateur.get_full_name', read_only=True)
    duree_calculee = serializers.SerializerMethodField()
    
    class Meta:
        model = FormationSession
        fields = [
            'id', 'formation_type_nom', 'date_debut', 'date_fin', 
            'formateur_nom', 'statut', 'duree_calculee'
        ]

    def get_duree_calculee(self, obj):
        method_or_value = obj.duree_calculee
        return method_or_value() if callable(method_or_value) else method_or_value

class FormationSessionSerializer(serializers.ModelSerializer):
    formation_type = FormationTypeSerializer(read_only=True)
    formateur = serializers.StringRelatedField(read_only=True)
    duree_calculee = serializers.SerializerMethodField()
    est_passee = serializers.SerializerMethodField()
    est_en_cours = serializers.SerializerMethodField()
    est_a_venir = serializers.SerializerMethodField()
    
    formation_type_id = serializers.PrimaryKeyRelatedField(
        queryset=FormationType.objects.all(),
        source='formation_type',
        write_only=True,
        help_text="ID du type de formation"
    )
    formateur_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='intern', is_active=True),  # Base query
        source='formateur',
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID du formateur (stagiaire avec au moins 1 mois d'ancienneté)"
    )

    class Meta:
        model = FormationSession
        fields = [
            'id', 'formation_type', 'formation_type_id', 
            'date_debut', 'date_fin', 'formateur', 'formateur_id', 
            'statut', 'duree_calculee', 'est_passee', 'est_en_cours', 'est_a_venir',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['statut', 'created_at', 'updated_at']

    def get_duree_calculee(self, obj):
        method_or_value = obj.duree_calculee
        return method_or_value() if callable(method_or_value) else method_or_value

    def get_est_passee(self, obj):
        method_or_value = obj.est_passee
        return method_or_value() if callable(method_or_value) else method_or_value

    def get_est_en_cours(self, obj):
        method_or_value = obj.est_en_cours
        return method_or_value() if callable(method_or_value) else method_or_value

    def get_est_a_venir(self, obj):
        method_or_value = obj.est_a_venir
        return method_or_value() if callable(method_or_value) else method_or_value

    def validate_date_debut(self, value):
        """Validation de la date de début"""
        if value and value < timezone.now():
            raise serializers.ValidationError(
                "La date de début ne peut pas être dans le passé."
            )
        return value

    def validate(self, data):
        """Validation croisée des dates"""
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        
        # Si on est en train de mettre à jour, utiliser les valeurs existantes si non fournies
        if self.instance:
            date_debut = date_debut if date_debut is not None else self.instance.date_debut
            date_fin = date_fin if date_fin is not None else self.instance.date_fin
        
        if date_debut and date_fin:
            if date_debut >= date_fin:
                raise serializers.ValidationError({
                    'date_fin': 'La date de fin doit être postérieure à la date de début.'
                })
            
            # Validation de la durée minimale (30 minutes)
            duree_min_minutes = 30
            duree = (date_fin - date_debut).total_seconds() / 60  # en minutes
            if duree < duree_min_minutes:
                raise serializers.ValidationError({
                    'date_fin': f'La durée de la formation doit être d\'au moins {duree_min_minutes} minutes.'
                })
        
        return data

    def create(self, validated_data):
        """Création avec mise à jour automatique du statut"""
        instance = super().create(validated_data)
        instance.update_statut()
        return instance

    def update(self, instance, validated_data):
        """Mise à jour avec mise à jour automatique du statut"""
        instance = super().update(instance, validated_data)
        instance.update_statut()
        return instance


class FormationSessionCalendarSerializer(serializers.ModelSerializer):
    """Serializer optimisé pour l'affichage calendaire"""
    title = serializers.CharField(source='formation_type.nom', read_only=True)
    start = serializers.DateTimeField(source='date_debut', read_only=True)
    end = serializers.DateTimeField(source='date_fin', read_only=True)
    formateur_nom = serializers.CharField(source='formateur.get_full_name', read_only=True)
    className = serializers.SerializerMethodField()
    
    class Meta:
        model = FormationSession
        fields = [
            'id', 'title', 'start', 'end', 'statut', 
            'formateur_nom', 'className'
        ]
    
    def get_className(self, obj):
        """Retourne la classe CSS en fonction du statut"""
        class_map = {
            'PLAN': 'event-planifie',
            'ENCOURS': 'event-en-cours', 
            'TERMINEE': 'event-termine'
        }
        return class_map.get(obj.statut, 'event-planifie')


class FormationSessionStatutSerializer(serializers.ModelSerializer):
    """Serializer spécifique pour la mise à jour du statut"""
    class Meta:
        model = FormationSession
        fields = ['statut']
    
    def validate_statut(self, value):
        """Validation du changement de statut"""
        instance = self.instance
        if instance and value == 'TERMINEE' and not instance.date_fin:
            raise serializers.ValidationError(
                "Impossible de marquer comme terminée une session sans date de fin."
            )
        return value


class FormationSessionDetailSerializer(FormationSessionSerializer):
    """Serializer détaillé avec les informations de la formation"""
    supports_formation = serializers.SerializerMethodField()
    
    class Meta(FormationSessionSerializer.Meta):
        fields = FormationSessionSerializer.Meta.fields + ['supports_formation']
    
    def get_supports_formation(self, obj):
        """Récupère les supports de la formation associée"""
        supports = obj.formation_type.supports.all()
        return SupportFormationSerializer(supports, many=True).data