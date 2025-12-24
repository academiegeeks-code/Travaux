"""
Sérialiseurs pour la gestion des thèmes de stage.
"""
from rest_framework import serializers
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .models import Theme
from user_management.models import User
from user_management.Serializers.User_Serializer import UserSerializer

class LimitedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'full_name')

class ThemeSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Le stagiaire assigné (via la relation inverse)
    assigned_to_details = serializers.SerializerMethodField()

    def get_assigned_to_details(self, obj):
        if hasattr(obj, 'assigned_intern'):  # related_name dans User.assigned_theme
            intern = obj.assigned_intern
            return {
                "id": intern.id,
                "full_name": intern.full_name,
                "email": intern.email,
            }
        return None

    is_assignable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Theme
        fields = [
            'id',
            'title',           # ← C'EST ÇA LE CHAMP RÉEL DANS LA BASE
            'description',
            'created_date',
            'assignment_date',
            'status',
            'status_display',
            'is_active',
            'is_assignable',
            'assigned_to_details',
            'days_since_creation',
            'days_since_assignment',
        ]
        read_only_fields = ['created_date', 'assignment_date', 'status', 'is_assignable']       

class ThemeCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la création de thèmes."""
    
    class Meta:
        model = Theme
        fields = ['title', 'description', 'is_active']
    
    def create(self, validated_data):
        """Création d'un thème avec statut par défaut."""
        return Theme.objects.create(**validated_data)

class ThemeAssignmentSerializer(serializers.Serializer):
    """Sérialiseur pour l'attribution de thèmes."""
    
    intern_id = serializers.IntegerField()
    assignment_date = serializers.DateTimeField(required=False)
    
    def validate_intern_id(self, value):
        """Validation de l'ID du stagiaire."""
        try:
            intern = User.objects.get(pk=value, role='intern', is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                _("Stagiaire non trouvé ou inactif.")
            )
        
        # Vérifier si le stagiaire a déjà un thème
        if hasattr(intern, 'assigned_theme'):
            raise serializers.ValidationError(
                _("Ce stagiaire a déjà un thème attribué.")
            )
        
        return value
    
    def validate(self, attrs):
        """Validation globale."""
        intern_id = attrs.get('intern_id')
        assignment_date = attrs.get('assignment_date')
        
        if assignment_date and assignment_date > timezone.now():
            raise serializers.ValidationError({
                'assignment_date': _("La date d'attribution ne peut pas être dans le futur.")
            })
        
        return attrs



class AvailableInternSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les stagiaires disponibles."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    filiere = serializers.CharField(source='profile.filiere', read_only=True)
    university = serializers.CharField(
        source='profile.university_studies', 
        read_only=True
    )
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'filiere', 'university']

class ThemeStatsSerializer(serializers.Serializer):
    """Sérialiseur pour les statistiques."""
    
    total = serializers.IntegerField()
    available = serializers.IntegerField()
    assigned = serializers.IntegerField()
    active = serializers.IntegerField()
    recent = serializers.IntegerField()
    
    status_distribution = serializers.ListField(
        child=serializers.DictField()
    )