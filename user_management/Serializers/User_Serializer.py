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

# Serializer pour l'obtention de token JWT avec vérification d'expiration du mot de passe
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

# Serializer pour le profil utilisateur
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

# Serializer pour l'enregistrement des utilisateurs
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
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'role', 'password', 'confirm_password', 'profile']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone_number': {'required': False},
            'role': {'required': False, 'default': 'intern'}
        }

    def validate_email(self, value):
        """Valide l'email."""
        from django.core.validators import validate_email
        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError('Format d\'email invalide.')
        
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Cet email est déjà enregistré.')
            
        return value.lower()

    def validate(self, data):
        """Valide les mots de passe et les permissions de rôle."""
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
            from Travaux.user_management.Services.services import UserImportService
            data['password'] = UserImportService.generate_secure_temp_password()
        
        # Validation du rôle
        valid_roles = ['admin', 'supervisor', 'intern', 'visitor']
        role = data.get('role', 'intern')
        if role not in valid_roles:
            raise serializers.ValidationError({
                'role': f'Rôle invalide. Valeurs possibles: {valid_roles}'
            })

        if role == 'admin':
            data['is_staff'] = True
            data['is_superuser'] = True

        return data

    def create(self, validated_data):
        """Crée un utilisateur avec son profil."""
        from user_management.tasks import send_activation_email
        from django.db import transaction

        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password')
        validated_data.pop('confirm_password', None)

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    password=password,
                    username=validated_data['email'].split('@')[0],  # Generate username from email
                    **validated_data
                )
                
                # Create profile if not already created by signal
                if not hasattr(user, 'profile'):
                    Profile.objects.create(user=user, **profile_data)
                elif profile_data:
                    profile = user.profile
                    for attr, value in profile_data.items():
                        setattr(profile, attr, value)
                    profile.save()

                # Send activation email for non-visitor roles
                if not user.is_active and user.role != 'visitor':
                    send_activation_email.delay(
                        user.email,
                        user.first_name,
                        str(user.activation_token),
                        user.password_expiry.isoformat() if user.password_expiry else (timezone.now() + timedelta(hours=24)).isoformat()
                    )
                
                return user
                
        except Exception as e:
            logger.error(f"Échec de la création de l'utilisateur {validated_data.get('email')}: {str(e)}")
            raise serializers.ValidationError(
                "La création de l'utilisateur a échoué. Veuillez réessayer."
            )

# Serializer pour l'activation des utilisateurs
class ActivationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    activation_token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        print("=== VALIDATION SERIALIZER ===")
        print("Données à valider:", data)
        
        try:
            # Validation des mots de passe
            if data['password'] != data['confirm_password']:
                print("Mots de passe différents")
                raise serializers.ValidationError({'confirm_password': 'Les mots de passe ne correspondent pas.'})
            
            # Validation de la force du mot de passe
            try:
                from django.contrib.auth.password_validation import validate_password
                validate_password(data['password'])
                print("Mot de passe valide")
            except Exception as e:
                print("Mot de passe invalide:", e)
                raise serializers.ValidationError({'password': list(e.messages)})
            
            # Validation du token
            print("Recherche de l'utilisateur:", data['email'])
            user = User.objects.get(
                email__iexact=data['email'], 
                activation_token=data['activation_token']
            )
            print("Utilisateur trouvé:", user.email)
            
            if user.is_active:
                print("Utilisateur déjà actif")
                raise serializers.ValidationError('Le compte est déjà activé.')
                
            if not user.is_activation_token_valid(data['activation_token']):
                print("Token invalide ou expiré")
                raise serializers.ValidationError('Token d\'activation invalide ou expiré.')
                
            data['user'] = user
            print("Validation réussie")
            return data
            
        except User.DoesNotExist:
            print("Utilisateur non trouvé")
            raise serializers.ValidationError('Email ou token d\'activation invalide.')
        except Exception as e:
            print("Erreur lors de la validation:", e)
            raise

    def activate(self):
        print("=== ACTIVATION ===")
        user = self.validated_data['user']
        print("Activation de l'utilisateur:", user.email)
        
        user.is_active = True
        user.activation_token = None
        user.activation_token_expiry = None
        user.set_password(self.validated_data['password'])
        user.must_change_password = False
        user.status = User.Status.ACTIVE
        
        print("Sauvegarde de l'utilisateur...")
        user.save()
        print("Utilisateur sauvegardé")
        
        return user

# Serializer pour l'affichage des utilisateurs
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'last_login',
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

# Serializer pour la création d'un seul utilisateur
class UserCreateSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    
    # Champs compatibles avec votre formulaire React
    nom = serializers.CharField(write_only=True, source='last_name', required=False)
    prenom = serializers.CharField(write_only=True, source='first_name', required=False)
    telephone = serializers.CharField(write_only=True, source='phone_number', required=False, allow_blank=True)
    
    # Champs de fallback
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    
    supervisor_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)

    # Champs pour le profil qui peuvent être envoyés au niveau racine
    filiere = serializers.CharField(write_only=True, required=False, allow_blank=True)
    domain_study = serializers.CharField(write_only=True, required=False, allow_blank=True)
    profession = serializers.CharField(write_only=True, required=False, allow_blank=True)
    university_studies = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'prenom', 'nom', 'first_name', 'last_name', 
            'telephone', 'phone_number', 'role', 'supervisor_email', 'profile',
            'filiere', 'domain_study', 'profession', 'university_studies'  # Champs profil directs
        ]
        extra_kwargs = {
            'email': {'required': True},
            'role': {'required': True}
        }

    def validate_phone_number(self, value):
        """Validation flexible du numéro de téléphone."""
        if not value or value.strip() == '':
            return ''
            
        cleaned_phone = re.sub(r'[\s\-\(\)]', '', value)
        
        if not re.match(r'^\+?\d{9,15}$', cleaned_phone):
            raise serializers.ValidationError(
                'Le numéro doit contenir 9 à 15 chiffres, optionnellement précédé d\'un +.'
            )
        return cleaned_phone

    def validate(self, data):
        """Validation globale avec gestion des champs nom/prénom."""
        # Gestion des noms
        if data.get('prenom') and data.get('nom'):
            data['first_name'] = data['prenom']
            data['last_name'] = data['nom']
        elif data.get('first_name') and data.get('last_name'):
            data['prenom'] = data['first_name']
            data['nom'] = data['last_name']
        else:
            if not data.get('prenom') and not data.get('first_name'):
                raise serializers.ValidationError({
                    'prenom': 'Le prénom est requis.'
                })
            if not data.get('nom') and not data.get('last_name'):
                raise serializers.ValidationError({
                    'nom': 'Le nom est requis.'
                })

        # Gestion du téléphone
        if data.get('telephone'):
            data['phone_number'] = data['telephone']
        elif data.get('phone_number'):
            data['telephone'] = data['phone_number']

        # Validation du rôle
        valid_roles = ['admin', 'supervisor', 'intern', 'visitor']
        role = data.get('role', 'intern')
        if role not in valid_roles:
            raise serializers.ValidationError({
                'role': f'Rôle invalide. Valeurs possibles: {", ".join(valid_roles)}'
            })

        # Préparer les données du profil
        profile_data = data.get('profile', {})
        
        # Ajouter les champs profil directs s'ils sont fournis
        if data.get('filiere'):
            profile_data['filiere'] = data['filiere']
        if data.get('domain_study'):
            profile_data['domain_study'] = data['domain_study']
        if data.get('profession'):
            profile_data['profession'] = data['profession']
        if data.get('university_studies'):
            profile_data['university_studies'] = data['university_studies']
        
        # Validation conditionnelle - seulement si des données de profil sont fournies
        if role == 'supervisor' and profile_data.get('profession'):
            # Si un superviseur et qu'une profession est fournie, elle doit être valide
            if not profile_data['profession'].strip():
                raise serializers.ValidationError({
                    'profession': 'La profession ne peut pas être vide.'
                })
                
        if role == 'intern' and profile_data.get('filiere'):
            # Si un stagiaire et qu'une filière est fournie, elle doit être valide
            if not profile_data['filiere'].strip():
                raise serializers.ValidationError({
                    'filiere': 'La filière ne peut pas être vide.'
                })
        
        # Stocker les données du profil pour la création
        data['profile_data'] = profile_data
        
        return data

    def create(self, validated_data):
        """Crée un utilisateur avec mot de passe temporaire."""
        from Travaux.user_management.Services.services import UserImportService
        from user_management.tasks import send_activation_email
        from django.db import transaction

        # Extraire les données du profil
        profile_data = validated_data.pop('profile_data', {})
        
        # Nettoyer les champs write_only
        validated_data.pop('prenom', None)
        validated_data.pop('nom', None)
        validated_data.pop('telephone', None)
        validated_data.pop('supervisor_email', None)
        validated_data.pop('filiere', None)
        validated_data.pop('domain_study', None)
        validated_data.pop('profession', None)
        validated_data.pop('university_studies', None)
        validated_data.pop('profile', None)  # Au cas où

        try:
            with transaction.atomic():
                # Créer l'utilisateur
                user = User.objects.create_user(
                    email=validated_data['email'],
                    password=None,
                    **{k: v for k, v in validated_data.items() if k != 'email'}
                )
                
                # Mettre à jour le profil avec les données fournies
                if profile_data:
                    Profile.objects.update_or_create(
                        user=user,
                        defaults=profile_data
                    )

                # Envoyer l'email d'activation
                if not user.is_active and user.role != 'visitor':
                    send_activation_email.delay(
                        user.email,
                        user.first_name,
                        str(user.activation_token),
                        user.password_expiry.isoformat() if user.password_expiry else None
                    )
                
                return user
                
        except Exception as e:
            logger.error(f"Échec de la création de l'utilisateur {validated_data.get('email')}: {str(e)}")
            raise serializers.ValidationError(
                f"La création de l'utilisateur a échoué: {str(e)}"
            )