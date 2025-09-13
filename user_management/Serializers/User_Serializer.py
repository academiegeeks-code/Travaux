from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import re, logging
from user_management.models import Profile, User
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta

logger=logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        """Vérifie que le mot de passe n'a pas expiré avant de délivrer le token."""
        data = super().validate(attrs)
        if self.user.is_password_expired():
            raise serializers.ValidationError(
                'Le mot de passe a expiré. Veuillez le réinitialiser.'
            )
        return data


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['address', 'profession', 'specialty', 'university_teaches', 
                 'filiere', 'domain_study', 'university_studies', 'age']

    def validate(self, data):
        """Impose les validations spécifiques aux rôles."""
        user = self.context.get('request').user if self.context.get('request') else None
        
        if user and user.is_authenticated:
            if user.role == 'supervisor' and not data.get('profession'):
                raise serializers.ValidationError({
                    'profession': 'La profession est requise pour les superviseurs.'
                })
            if user.role == 'intern' and not data.get('filiere'):
                raise serializers.ValidationError({
                    'filiere': 'La filière est requise pour les stagiaires.'
                })
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=False, 
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, 
        required=False,
        min_length=8,
        style={'input_type': 'password'}
    )
    profile = ProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 
                 'role', 'password', 'confirm_password', 'profile']

    def validate_email(self, value):
        """Valide l'email."""
        try:
            django_validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError('Format d\'email invalide.')
        
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Cet email est déjà enregistré.')
            
        return value.lower()

    def validate(self, data):
        """Valide les mots de passe et les permissions de rôle."""
        request = self.context.get('request')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        # Validation des mots de passe
        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError({
                    'confirm_password': 'Les mots de passe ne correspondent pas.'
                })
            try:
                validate_password(password)
            except DjangoValidationError as e:
                raise serializers.ValidationError({'password': list(e.messages)})
        else:
            # Génération d'un mot de passe sécurisé
            # Utilisez votre fonction existante pour générer le mot de passe
            from user_management.models import generate_secure_temp_password
            data['password'] = generate_secure_temp_password(length=12)
            # Le manager CustomUserManager gérera automatiquement must_change_password et password_expiry
        # Validation des permissions de rôle
        # ⚠️ CORRECTION : Assurez-vous que les admins aient is_staff = True
        if data.get('role') == 'admin':
            data['is_staff'] = True
            data['is_superuser'] = True  # Probablement aussi nécessaire

        return data

    def create(self, validated_data):
        """Crée un utilisateur avec son profil."""
        from user_management.tasks import send_activation_email  # ← Import local pour éviter circular imports

        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password')
        validated_data.pop('confirm_password', None)
        from django.db import transaction
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    password=password,
                    **validated_data
                )
                
                # Création du profil
                if hasattr(user, 'profile') and profile_data:
                    profile = user.profile
                    for attr, value in profile_data.items():
                        setattr(profile, attr, value)
                    profile.save()
                elif profile_data:
                    # Fallback si le signal n'a pas fonctionné
                    Profile.objects.create(user=user, **profile_data)
            
                
                # Envoi de l'email d'activation si nécessaire
                if not user.is_active and user.role != 'visitor':
                    send_activation_email.delay(
                        user.email,
                        user.first_name,
                        str(user.activation_token),
                        user.activation_token_expiry.isoformat(),
                        user.password_expiry.isoformat() if user.password_expiry else (timezone.now() + timedelta(hours=24)).isoformat() # ← Ajoutez cet argument
                    )
                
                return user
                
        except Exception as e:
            logger.error(f"Échec de la création de l'utilisateur {validated_data.get('email')}: {e}")
            raise serializers.ValidationError(
                "La création de l'utilisateur a échoué. Veuillez réessayer."
            )



class ActivationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    activation_token = serializers.UUIDField()

    def validate(self, data):
        """Valide le token d'activation."""
        try:
            user = User.objects.get(
                email__iexact=data['email'], 
                activation_token=data['activation_token']
            )
            
            if user.is_active:
                raise serializers.ValidationError('Le compte est déjà activé.')
                
            if not user.is_activation_token_valid(data['activation_token']):
                raise serializers.ValidationError('Token d\'activation invalide ou expiré.')
                
            data['user'] = user
            return data
            
        except User.DoesNotExist:
            raise serializers.ValidationError('Email ou token d\'activation invalide.')

    def activate(self):
        """Active le compte utilisateur."""
        user = self.validated_data['user']
        user.is_active = True
        user.activation_token = None
        user.activation_token_expiry = None
        user.save()
        return user



class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['address', 'profession', 'specialty', 'university_teaches', 
                 'filiere', 'domain_study', 'university_studies', 'age']

    def validate(self, data):
        """Impose les validations spécifiques aux rôles."""
        user = self.context.get('request').user if self.context.get('request') else None
        
        if user and user.is_authenticated:
            if user.role == 'supervisor' and not data.get('profession'):
                raise serializers.ValidationError({
                    'profession': 'La profession est requise pour les superviseurs.'
                })
            if user.role == 'intern' and not data.get('filiere'):
                raise serializers.ValidationError({
                    'filiere': 'La filière est requise pour les stagiaires.'
                })
        return data


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 
                 'role', 'is_active', 'is_staff', 'date_joined', 'profile']
        read_only_fields = ['id', 'is_staff', 'date_joined', 'is_active']

    def validate_email(self, value):
        """Valide le format et l'unicité de l'email."""
        try:
            django_validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError('Format d\'email invalide.')

        if User.objects.filter(email__iexact=value).exclude(pk=getattr(self.instance, 'pk', None)).exists():
            raise serializers.ValidationError('Cet email est déjà utilisé.')
        return value.lower()

    def validate_phone_number(self, value):
        """Valide le format du numéro de téléphone."""
        if value and not re.match(r'^\+?\d{9,15}$', value):
            raise serializers.ValidationError(
                'Le numéro de téléphone doit contenir 9 à 15 chiffres, optionnellement précédé d\'un +.'
            )
        return value

    def update(self, instance, validated_data):
        """Met à jour l'utilisateur et le profil avec validation."""
        profile_data = validated_data.pop('profile', {})
        
        # Mise à jour de l'utilisateur
        for attr, value in validated_data.items():
            if attr not in self.Meta.read_only_fields:
                setattr(instance, attr, value)
        instance.save()

        # Mise à jour du profil
        profile = instance.profile
        if profile:
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        else:
            Profile.objects.create(user=instance, **profile_data)
            
        return instance
