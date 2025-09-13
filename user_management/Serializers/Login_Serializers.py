from rest_framework import serializers
import requests
from bcef_innovation_backend import settings
from django.contrib.auth import authenticate

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    recaptcha_token = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        recaptcha_token = data.get('recaptcha_token')

        # 1. Vérifier le reCAPTCHA
        r = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={
                'secret': settings.RECAPTCHA_PRIVATE_KEY,
                'response': recaptcha_token
            }
        )
        result = r.json()
        if not result.get('success'):
            raise serializers.ValidationError("Échec de la vérification reCAPTCHA.")

        # 2. Authentifier l'utilisateur
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Identifiants incorrects.")
        if not user.is_active:
            raise serializers.ValidationError("Ce compte est désactivé.")

        data['user'] = user
        return data
