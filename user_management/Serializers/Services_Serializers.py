

# serializers.py (version améliorée)
import logging
from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from user_management.Serializers.User_Serializer import UserRegistrationSerializer
from rest_framework import serializers
from django.conf import settings

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

