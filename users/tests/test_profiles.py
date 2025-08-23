import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
from rest_framework import status
import json
@pytest.mark.django_db
class TestAdminProfileView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='strongpassword123',
            is_staff=True,
            role='admin',
            is_active=True
        )
        self.user = User.objects.create_user(
            email='user@example.com',
            password='strongpassword123',
            is_staff=False,
            role='intern',
            is_active=True
        )
        self.client = APIClient()

    def test_get_admin_profile_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('users:profilea', kwargs={'pk': self.admin.pk})
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data['email'] == self.admin.email
        
    def test_get_admin_profile_as_non_admin(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('users:profilea', kwargs={'pk': self.user.pk})
        response = self.client.get(url)
        assert response.status_code == 403
        # Utiliser .json() car JsonResponse n'a pas .data
        json_data = response.json()
        assert json_data['detail'] =='You do not have permission to perform this action.'
        

    def test_put_admin_profile_success(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('users:profilea', kwargs={'pk': self.admin.pk})
        new_data = {'first_name': 'NewName', 'last_name': 'NewLast'}
        response = self.client.put(url, new_data, format='json')
        assert response.status_code == 200
        # Utiliser .json() car JsonResponse n'a pas .data
        json_data = response.json()
        assert json_data['first_name'] == 'NewName'
        assert json_data['last_name'] == 'NewLast'

    def test_put_admin_profile_as_non_admin(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('users:profilea', kwargs={'pk': self.user.pk})
        new_data = {'first_name': 'Banana'}
        response = self.client.put(url, new_data, format='json')
        assert response.status_code == 403
        # Utiliser .json() car JsonResponse n'a pas .data
        json_data = response.json()
        assert json_data['detail'] == 'You do not have permission to perform this action.'

@pytest.mark.django_db
class TestProfileView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.user = User.objects.create_user(
            email='user2@example.com',
            password='strongpassword123',
            is_active=True
        )
        self.client = APIClient()

    def test_get_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('users:user-profile')  # nom corrigé
        response = self.client.get(url)
        assert response.status_code == 200
        # Utiliser .json() car JsonResponse n'a pas .data
        json_data = response.json()
        assert json_data['email'] == self.user.email

    def test_get_profile_unauthenticated(self):
        url = reverse('users:user-profile')
        response = self.client.get(url)
        assert response.status_code == 401  # Non authentifié
