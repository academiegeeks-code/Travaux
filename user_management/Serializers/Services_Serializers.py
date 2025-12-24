

# serializers.py (version améliorée)
import logging
from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from user_management.Serializers.User_Serializer import UserRegistrationSerializer
from rest_framework import serializers
from django.conf import settings
import re

from user_management.models import Profile, Suggestion
from user_management.permissions import Permission

logger = logging.getLogger(__name__)
User = get_user_model()



class BulkUserCreateSerializer(serializers.Serializer):
    users = serializers.ListField(
        child=UserRegistrationSerializer(), 
        min_length=1,
        max_length=100  # ← Limite de sécurité
    )

    def validate(self, data):
        """Vérifie que seul un admin peut faire des imports en masse."""
        request = self.context.get('request')
        if not request or not request.user.has_perm('users.bulk_import'):
            raise serializers.ValidationError(
                'Seuls les administrateurs peuvent effectuer des imports en masse.'
            )
        return data



class UserCreateSerializer(serializers.ModelSerializer):
    # Champs compatibles avec votre formulaire React
    nom = serializers.CharField(write_only=True, source='last_name', required=False)
    prenom = serializers.CharField(write_only=True, source='first_name', required=False)
    telephone = serializers.CharField(write_only=True, source='phone_number', required=False, allow_blank=True)
    supervisor_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'prenom', 'nom', 'telephone', 'role', 'supervisor_email']
        extra_kwargs = {
            'email': {'required': True},
            'role': {'required': True}
        }

    def validate(self, data):
        """Validation simplifiée."""
        if not data.get('prenom') and not data.get('first_name'):
            raise serializers.ValidationError({'prenom': 'Le prénom est requis.'})
        if not data.get('nom') and not data.get('last_name'):
            raise serializers.ValidationError({'nom': 'Le nom est requis.'})

        # Nettoyage du téléphone
        if data.get('telephone'):
            phone = data['telephone']
            cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
            if not re.match(r'^\+?\d{9,15}$', cleaned_phone):
                raise serializers.ValidationError({
                    'telephone': 'Format de téléphone invalide.'
                })
            data['phone_number'] = cleaned_phone

        return data

    def create(self, validated_data):
        """Utilise le service pour créer l'utilisateur."""
        from Travaux.user_management.Services.services import UserCreationService  # ← IMPORT ICI
        
        # Récupérer l'utilisateur qui fait la création depuis le contexte
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Utilisateur non authentifié")
        
        # Préparer les données pour le service
        user_data = {
            'email': validated_data.get('email'),
            'first_name': validated_data.get('first_name', ''),
            'last_name': validated_data.get('last_name', ''),
            'phone_number': validated_data.get('phone_number', ''),
            'role': validated_data.get('role', 'intern'),
        }
        
        # Ajouter les champs français si fournis
        if validated_data.get('prenom'):
            user_data['first_name'] = validated_data['prenom']
        if validated_data.get('nom'):
            user_data['last_name'] = validated_data['nom']
        if validated_data.get('telephone'):
            user_data['phone_number'] = validated_data['telephone']
        
        # UTILISATION DU SERVICE ← C'EST ICI QU'ON L'UTILISE
        service = UserCreationService()
        user = service.create_single_user(
            user_data=user_data,
            created_by=request.user
        )
        
        return user