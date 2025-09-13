from rest_framework import serializers
from user_management.models import User
from django.contrib.auth.password_validation import validate_password


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        """Valide silencieusement pour des raisons de sécurité."""
        return value.lower()

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_new_password(self, value):
        """Valide la force du nouveau mot de passe."""
        validate_password(value)
        return value

    def validate(self, attrs):
        """Valide le token de réinitialisation."""
        try:
            user = User.objects.get(password_reset_token=attrs['token'])
            
            if not user.is_password_reset_token_valid(attrs['token']):
                raise serializers.ValidationError('Token de réinitialisation invalide ou expiré.')
                
            attrs['user'] = user
            return attrs
            
        except User.DoesNotExist:
            raise serializers.ValidationError('Token de réinitialisation invalide.')

    def save(self):

        """Sauvegarde le nouveau mot de passe."""
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.password_reset_token = None
        user.password_reset_token_expiry = None
        user.must_change_password = False
        user.save()

