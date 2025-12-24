# communication_management/serializers.py
from rest_framework import serializers
from .models import Announcement
from django.utils import timezone

class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer pour la liste et le détail des annonces"""
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_published = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'content', 
            'publication_date',
            'priority',
            'priority_display',
            'is_active',
            'is_published',
            'created_by',
            'created_by_email',
            'created_by_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        """Retourne le nom complet du créateur"""
        if obj.created_by:
            return obj.created_by.full_name
        return "Utilisateur inconnu"

class AnnouncementCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'annonces (admin seulement)"""
    
    class Meta:
        model = Announcement
        fields = [
            'title',
            'content',
            'publication_date', 
            'priority',
            'is_active'
        ]

    def validate_publication_date(self, value):
        """Valide que la date de publication n'est pas dans le passé"""
        if value < timezone.now():
            raise serializers.ValidationError("La date de publication ne peut pas être dans le passé.")
        return value

class AnnouncementUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la modification d'annonces (admin seulement)"""
    
    class Meta:
        model = Announcement
        fields = [
            'title',
            'content', 
            'publication_date',
            'priority',
            'is_active'
        ]

    def validate_publication_date(self, value):
        """Valide que la date de publication n'est pas trop ancienne"""
        # Accepter les dates à partir de maintenant (avec marge de 1 minute pour latence)
        if value < timezone.now() - timezone.timedelta(minutes=1):
            raise serializers.ValidationError(
                "La date de publication doit être présente ou future."
            )
        return value