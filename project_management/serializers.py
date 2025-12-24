# projects/serializers.py
from rest_framework import serializers
from .models import Projet

class ProjetListSerializer(serializers.ModelSerializer):
    formation = serializers.CharField(source='formation.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Projet
        fields = ['id', 'titre', 'formation', 'statut', 'statut_display',
                  'date_debut', 'date_fin', 'date_creation']

class ProjetDetailSerializer(serializers.ModelSerializer):
    formation = serializers.CharField(source='formation.nom', read_only=True)
    fichier_url = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Projet
        fields = ['id', 'titre', 'description', 'objectifs', 'statut', 'statut_display',
                  'formation', 'date_debut', 'date_fin', 'date_creation', 'fichier_url']

    def get_fichier_url(self, obj):
        if obj.fichier and hasattr(obj.fichier, 'url'):
            request = self.context.get('request')
            return request.build_absolute_uri(obj.fichier.url) if request else obj.fichier.url
        return None

class ProjetSerializer(serializers.ModelSerializer):
    fichier = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = Projet
        fields = ['id', 'titre', 'description', 'objectifs', 'statut',
                  'formation', 'date_debut', 'date_fin', 'fichier']
        read_only_fields = ['date_creation']
    
    def validate_fichier(self, value):
        """Valider la taille et le type de fichier"""
        if value:
            # Limite à 50MB
            if value.size > 50 * 1024 * 1024:
                raise serializers.ValidationError("Le fichier doit faire moins de 50MB.")
            
            # Extensions autorisées
            ext = value.name.rsplit('.', 1)[-1].lower()
            allowed = ['pdf', 'doc', 'docx', 'zip', 'txt']
            if ext not in allowed:
                raise serializers.ValidationError(f"Extension non autorisée. Utilisez: {', '.join(allowed)}")
        
        return value