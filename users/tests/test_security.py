# users/tests/test_security.py
import pytest
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
import json
from unittest.mock import patch, MagicMock
User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def active_user(db):
    return User.objects.create_user(
        email='active@example.com',
        password='password123',
        is_active=True
    )

@pytest.fixture
def inactive_user(db):
    return User.objects.create_user(
        email='inactive@example.com',
        password='password123',
        is_active=False
    )

# Patch global pour désactiver le rate limit par défaut
@pytest.fixture(autouse=True)
def disable_rate_limit():
    with patch('users.mixins.RateLimitMixin.RateLimitMixin.check_rate_limit', return_value=(True, {})):
        yield

@pytest.mark.django_db
class TestActivationView:
    def test_activation_success(self, api_client, inactive_user):
        token = "valid_token"  # à adapter selon ta logique
        url = reverse('user-activation')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, {'token': token}, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_activation_invalid_data(self, api_client):
        url = reverse('users:user-activation')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, {'token': ''}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch('users.serializers.ActivationSerializer.activate', side_effect=Exception("Server error"))
    @patch('users.serializers.ActivationSerializer.is_valid', return_value=True)
    def test_activation_server_error(self, mock_is_valid, api_client, inactive_user):
        # Simuler une exception dans la vue
            url = reverse('users:user-activation')  # <-- utilise le name défini dans urls.py
            response = api_client.post(url, {'token': 'whatever'}, format='json')
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert response.data['detail'] == 'Activation failed due to a server error.'
            
    @patch('users.mixins.RateLimitMixin.RateLimitMixin.check_rate_limit', return_value=(False, {'detail': 'Too many activation attempts.', 'count': 5}))
    def test_activation_rate_limited(self, mock_rate, api_client):
        url = reverse('users:user-activation')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, {'token': 'whatever'}, format='json')
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert response.json()['detail'] == 'Too many activation attempts.'

@pytest.mark.django_db
class TestPasswordResetRequestView:
    def test_password_reset_request_success(self, api_client, active_user):
        url = reverse('users:password_reset_request')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, {'email': active_user.email}, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_password_reset_request_invalid(self, api_client):
        url = reverse('users:password_reset_request')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, {'email': 'not-an-email'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch('users.mixins.RateLimitMixin.RateLimitMixin.check_rate_limit', return_value=(False, {'detail': 'Too many password reset requests.', 'count': 3}))
    def test_password_reset_request_rate_limited(self, mock_rate, api_client, active_user):
        url = reverse('users:password_reset_confirm')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, {'email': active_user.email}, format='json')
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert response.json()['detail'] == 'Too many password reset requests.'


@pytest.mark.django_db
class TestPasswordResetConfirmView:
    #Ma vue attend un vrai token de réinitialisation, donc on simule la validation du serializer
    @patch('users.serializers.PasswordResetConfirmSerializer')
    def test_password_reset_confirm_success(self, MockSerializer,api_client, active_user):
        # On crée une instance factice de serializer
        mock_serializer_instance = MockSerializer.return_value
        mock_serializer_instance.is_valid.return_value = True
        mock_serializer_instance.validated_data = {'user_id': active_user.id}
        mock_serializer_instance.save.return_value = None  # juste pour ne rien faire

        payload = {'token': 'valid_token', 'new_password': 'newpass123'}
        url = reverse('users:password_reset_confirm')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['detail'] == 'Password reset successful.'

    def test_password_reset_confirm_invalid(self, api_client):
        payload = {'token': '', 'new_password': ''}
        url = reverse('users:password_reset_confirm')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch('users.mixins.RateLimitMixin.RateLimitMixin.check_rate_limit', return_value=(False, {'detail': 'Too many password reset confirm attempts.', 'count': 2}))
    def test_password_reset_confirm_rate_limited(self, mock_rate, api_client):
        payload = {'token': 'whatever', 'new_password': 'newpass123'}
        url = reverse('users:password_reset_confirm')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert response.json()['detail'] == 'Too many password reset confirm attempts.'

@pytest.mark.django_db
class TestPasswordChangeView:
    def test_password_change_success(self, api_client, active_user):
        api_client.force_authenticate(user=active_user)
        payload = {'old_password': 'password123', 'new_password': 'newpass123'}
        url = reverse('users:password_change')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_password_change_missing_fields(self, api_client, active_user):
        api_client.force_authenticate(user=active_user)
        payload = {'old_password': ''}
        url = reverse('users:password_change')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_change_wrong_old_password(self, api_client, active_user):
        api_client.force_authenticate(user=active_user)
        payload = {'old_password': 'wrongpass', 'new_password': 'newpass123'}
        url = reverse('users:password_change')
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST  # <-- reste 400


    def test_password_change_wrong_old_password(self, api_client, active_user):
        api_client.force_authenticate(user=active_user)
        payload = {'old_password': 'wrongpass', 'new_password': 'newpass123'}
        url = reverse('users:password_change')
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.json()['detail'] == 'Old password is incorrect.'


    def test_password_change_unauthenticated(self, api_client):
        payload = {'old_password': 'password123', 'new_password': 'newpass123'}
        url = reverse('users:password_change')  # <-- utilise le name défini dans urls.py
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
