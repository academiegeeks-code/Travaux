"""# serializers.py
 Sérialiseurs pour la gestion des utilisateurs, l'authentification, la gestion des profils et les suggestions.
 Ces sérialiseurs gèrent la validation, la création et la mise à jour des modèles User, Profile et Suggestion.
 Inclut la logique personnalisée pour l'inscription, l'activation, la réinitialisation du mot de passe et l'importation en masse des utilisateurs.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
import re
import uuid
from .models import User, Profile, Suggestion
from .permissions import Permission, ADMIN_PERMISSIONS, BASIC_USER_PERMISSIONS
from django.contrib.auth.password_validation import validate_password
from .tasks import send_activation_email


User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        """Ensure password is not expired before issuing token."""
        data = super().validate(attrs)
        if self.user.is_password_expired():
            raise serializers.ValidationError('Password has expired. Please reset your password.')
        return data


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['address', 'profession', 'specialty', 'university_teaches', 'filiere', 'domain_study', 'university_studies', 'age']

    def validate(self, data):
        """Enforce role-specific field requirements."""
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            if user.role == 'supervisor' and not data.get('profession'):
                raise serializers.ValidationError({'profession': 'Profession is required for supervisors.'})
            if user.role == 'intern' and not data.get('filiere'):
                raise serializers.ValidationError({'filiere': 'Filiere is required for interns.'})
        return data

    def update(self, instance, validated_data):
        # Update all fields with validation
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'is_active', 'is_staff', 'date_joined', 'profile']
        read_only_fields = ['id', 'is_staff', 'date_joined', 'is_active']

    def validate_email(self, value):
        """Ensure email format is valid and unique."""
        try:
            django_validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError('Invalid email format.')

        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    def validate_phone_number(self, value):
        """Validate phone number format (e.g., +1234567890 or 1234567890)."""
        if value and not re.match(r'^\+?\d{9,15}$', value):
            raise serializers.ValidationError('Phone number must be 9-15 digits, optionally starting with +.')
        return value

    def validate_role(self, value):
        """Restrict role changes to admins."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return value
        if Permission.MANAGE_USERS not in request.user.get_permissions() and value != request.user.role:
            raise serializers.ValidationError('Only admins can change user roles.')
        return value

    def update(self, instance, validated_data):
        """Update user and profile, restrict sensitive fields and update profile properly."""
        profile_data = validated_data.pop('profile', {})
        # Update user fields except read-only fields
        for attr, value in validated_data.items():
            if attr not in self.Meta.read_only_fields:
                setattr(instance, attr, value)
        instance.save()

        # Update or create profile, use serializer to benefit from validation/logic and signal handling
        profile = getattr(instance, 'profile', None)
        if profile:
            profile_serializer = ProfileSerializer(instance=profile, data=profile_data, partial=True, context=self.context)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()
        else:
            # Create profile if missing
            Profile.objects.create(user=instance, **profile_data)
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False, min_length=8)
    profile = ProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'role', 'password', 'confirm_password', 'profile']

    def validate_email(self, value):
        """Validate email format."""
        try:
            django_validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError('Invalid email format.')
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value

    def validate(self, data):
        """Validate passwords and role permissions."""
        request = self.context.get('request')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        else:
            # Generate password if none provided, with basic complexity check
            generated_password = str(uuid.uuid4())[:12]
            # Ensure the generated password has letters and digits
            while not (re.search(r'[A-Za-z]', generated_password) and re.search(r'\d', generated_password)):
                generated_password = str(uuid.uuid4())[:12]
            data['password'] = generated_password

        # Restrict role creation to admins or allowed roles
        if request and request.user.is_authenticated:
            if Permission.MANAGE_USERS not in request.user.get_permissions():
                if data.get('role') not in ['visitor', 'intern']:
                    raise serializers.ValidationError({'role': 'Only admins can create users with this role.'})
        else:
            # If anonymous, restrict role to visitor
            if data.get('role') not in ['visitor', None]:
                raise serializers.ValidationError({'role': 'Anonymous registration can only create visitor role.'})

        return data


    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role', 'visitor'),
            is_active=validated_data.get('is_active', False)
        )
        Profile.objects.create(user=user, **profile_data)
        if not user.is_active and user.role != 'visitor':
            send_activation_email.delay(
                user.email,
                user.first_name,
                str(user.activation_token),
                user.activation_token_expiry.isoformat(),
                user.password_expiry.isoformat()
            )
        return user

class BulkUserCreateSerializer(serializers.Serializer):
    users = serializers.ListField(child=UserRegistrationSerializer(), min_length=1)

    def validate(self, data):
        """Ensure only admins can perform bulk imports."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or Permission.BULK_IMPORT_USERS not in request.user.get_permissions():
            raise serializers.ValidationError('Only admins can perform bulk user imports.')
        return data

    def create(self, validated_data):
        """Bulk create users validating each entry."""
        users = []
        for user_data in validated_data['users']:
            reg_serializer = UserRegistrationSerializer(data=user_data, context=self.context)
            reg_serializer.is_valid(raise_exception=True)
            user = reg_serializer.save()
            users.append(user)
        return users


class SuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suggestion
        fields = ['id', 'domain_suggested', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        """Ensure domain_suggested is provided."""
        if not data.get('domain_suggested'):
            raise serializers.ValidationError({'domain_suggested': 'Domain is required.'})
        return data

    def create(self, validated_data):
        """Assign user if authenticated, else anonymous."""
        request = self.context.get('request', None)
        user = request.user if request and request.user.is_authenticated else None
        return Suggestion.objects.create(user=user, **validated_data)


class ActivationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    activation_token = serializers.UUIDField()

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'], activation_token=data['activation_token'])
            if not user.is_activation_token_valid(data['activation_token']):
                raise serializers.ValidationError('Invalid or expired activation token.')
            return data
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email or activation token.')

    def activate(self):
        """Activate the user account safely."""
        user = User.objects.get(email=self.validated_data['email'], activation_token=self.validated_data['activation_token'])
        user.is_active = True
        user.activation_token = uuid.uuid4()  # Invalidate old token
        user.password_expiry = None  # Clear expiry
        user.save()
        return user



class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Intentionally do not raise error if email not found
        return value

    def save(self):
        email = self.validated_data['email']
        try:
            user = User.objects.get(email=email, is_active=True)
            token = user.generate_password_reset_token()
            # TODO: send email with token link to user.email
            
        except User.DoesNotExist:
            pass  # Silent fail for security

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        token = attrs.get('token')
        try:
            user = User.objects.get(password_reset_token=token)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid or expired token.')

        if not user.is_password_reset_token_valid(token):
            raise serializers.ValidationError('Invalid or expired token.')

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.clear_password_reset_token()
        user.save()

