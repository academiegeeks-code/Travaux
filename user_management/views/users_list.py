from rest_framework.views import APIView
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from user_management.mixins import LoggingMixin, RateLimitMixin
import io, pandas as pd, tempfile
from django.db.models import Q
from datetime import timedelta
import uuid
from django.db import transaction
import logging
from user_management.models import User
from user_management.Serializers.User_Serializer import UserSerializer, UserRegistrationSerializer
from user_management.Serializers.User_Serializer import UserCreateSerializer
from user_management.permissions import Permission
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Pagination
class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# User List and Create
# User List and Create View - Version adaptée
class UserListView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [IsAuthenticated]
    rate_limit = 100
    rate_period = 60
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='list_users')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        queryset = User.objects.all().order_by('-date_joined')
        
        if request.user.role != 'admin':
            queryset = queryset.filter(role__in=['supervisor', 'intern'])

        # Filtres
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        domain = request.query_params.get('domain')
        if domain:
            queryset = queryset.filter(profile__domain_study__icontains=domain)

        university = request.query_params.get('university')
        if university:
            queryset = queryset.filter(profile__university_studies__icontains=university)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = UserSerializer(page, many=True, context={'request': request})

        self.log_success('list_users', {'count': len(serializer.data), 'role_filter': role})
        return paginator.get_paginated_response(serializer.data)

def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='create_user')
        if not allowed:
            self.log_security_event('user_create_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        # Vérification des permissions
        if request.user.role != 'admin' or not request.user.has_perm(Permission.MANAGE_USERS):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Transformation des données pour compatibilité
        data = request.data.copy()
        
        if 'first_name' in data and 'prenom' not in data:
            data['prenom'] = data['first_name']
        if 'last_name' in data and 'nom' not in data:
            data['nom'] = data['last_name']
        if 'phone_number' in data and 'telephone' not in data:
            data['telephone'] = data['phone_number']

        # Nettoyage
        data.pop('first_name', None)
        data.pop('last_name', None)
        data.pop('phone_number', None)
        data.pop('date_creation', None)

        data.setdefault('role', 'intern')

        # Validation
        serializer = UserCreateSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                
                self.log_success('user_created', {
                    'admin': request.user.email,
                    'new_user': user.email,
                    'role': user.role,
                    'user_id': user.id
                })
                
                # Retourner les données de l'utilisateur créé
                response_serializer = UserSerializer(user, context={'request': request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                self.log_error('user_creation_failed', e, {
                    'admin': request.user.email,
                    'data': data
                })
                return Response({
                    'detail': 'Erreur lors de la création de l\'utilisateur',
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

        self.log_error('user_validation_failed', Exception('ValidationError'), {
            'admin': request.user.email,
            'errors': serializer.errors
        })
        
        return Response({
            'detail': 'Données invalides',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)