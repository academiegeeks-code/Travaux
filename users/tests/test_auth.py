# users/tests/test_auth.py
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import logging
from unittest.mock import patch
import json
logger = logging.getLogger(__name__)

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return User.objects.create_user(
        email='testuser@example.com',
        password='testpassword123',
        last_login_ip='127.0.0.1',
        role='visitor',
        is_active=True
    )

@pytest.mark.django_db
class TestLoginView:
    def test_successful_login(self, api_client, user):
        """Teste une connexion réussie avec des identifiants valides."""
        data = {'email': 'testuser@example.com', 'password': 'testpassword123'}
        response = api_client.post('/api/login/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        user.refresh_from_db()
        assert user.last_login_ip == '127.0.0.1'

    def test_invalid_credentials(self, api_client):
        """Teste une tentative de connexion avec des identifiants invalides."""
        data = {'email': 'wrong@example.com', 'password': 'wrongpassword'}
        response = api_client.post('/api/login/', data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data['detail'] == 'Invalid credentials.'

    def test_missing_credentials(self, api_client):
        """Teste une tentative de connexion sans email ni mot de passe."""
        data = {}
        response = api_client.post('/api/login/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['detail'] == 'Email and password are required.'

    @patch('users.mixins.RateLimitMixin.RateLimitMixin.check_rate_limit')
    def test_rate_limit_exceeded(self, mock_check_rate_limit, api_client):
        """Teste le comportement lorsque la limite de taux est dépassée."""
        mock_check_rate_limit.return_value = (False, {'detail': 'Too many login attempts. Please try again later.', 'count': 11})
        data = {'email': 'testuser@example.com', 'password': 'testpassword123'}
        response = api_client.post('/api/login/', data, format='json')
        
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        # Utiliser .json() car JsonResponse n'a pas .data
        json_data = response.json()
        assert json_data['detail'] == 'Too many login attempts. Please try again later.'

@pytest.mark.django_db
class TestLogoutView:
    def test_successful_logout(self, api_client, user):
        """Teste une déconnexion réussie avec un token de rafraîchissement valide."""
        refresh = RefreshToken.for_user(user)
        api_client.force_authenticate(user=user)
        data = {'refresh': str(refresh)}
        response = api_client.post('/api/logout/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['detail'] == 'Successfully logged out.'

    def test_missing_refresh_token(self, api_client, user):
        """Teste une déconnexion sans fournir de token de rafraîchissement."""
        api_client.force_authenticate(user=user)
        data = {}
        response = api_client.post('/api/logout/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['detail'] == 'Refresh token is required.'

    def test_invalid_refresh_token(self, api_client, user):
        """Teste une déconnexion avec un token de rafraîchissement invalide."""
        api_client.force_authenticate(user=user)
        data = {'refresh': 'invalid_token'}
        response = api_client.post('/api/logout/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['detail'] == 'Invalid refresh token.'

    @patch('users.mixins.RateLimitMixin.RateLimitMixin.check_rate_limit')

    def test_rate_limit_exceeded(self, mock_check_rate_limit, api_client, user):
        """Teste le comportement lorsque la limite de taux est dépassée pour la déconnexion."""
        mock_check_rate_limit.return_value = (False, {'detail': 'Too many logout attempts. Please try again later.', 'count': 21})
        api_client.force_authenticate(user=user)
        data = {'refresh': str(RefreshToken.for_user(user))}
        response = api_client.post('/api/logout/', data, format='json')

        json_data = json.loads(response.content)
        assert json_data['detail'] == 'Too many logout attempts. Please try again later.'

    def test_unauthenticated_access(self, api_client):
        """Teste l'accès à la déconnexion sans authentification."""
        data = {'refresh': 'some_token'}
        response = api_client.post('/api/logout/', data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED