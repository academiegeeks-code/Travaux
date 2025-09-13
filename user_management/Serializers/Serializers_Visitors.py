
from rest_framework import serializers
from models import Suggestion


class SuggestionSerializer(serializers.ModelSerializer):
    """Serializer for the Suggestion model."""

    user = serializers.StringRelatedField(read_only=True)  
    # or use serializers.PrimaryKeyRelatedField if you want to expose user ID

    class Meta:
        model = Suggestion
        fields = [
            "id",
            "user",
            "email",
            "domain_suggested",
            "message",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]