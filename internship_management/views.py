"""
Vues API pour la gestion des thèmes de stage avec DRF.
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from . import permissions

from .models import Theme
from user_management.models import User
from .serializers import (
    ThemeSerializer, ThemeCreateSerializer, ThemeAssignmentSerializer, AvailableInternSerializer, ThemeStatsSerializer
)

class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = permissions.ThemeAccessPermission

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'supervisor']:
            return Theme.objects.all()
        # Les stagiaires ne voient que leur thème (via my-theme/)
        return Theme.objects.none()

    # Mon thème (pour les stagiaires)
    # Dans ThemeViewSet
    @action(detail=False, methods=['get'], url_path='my-theme')
    def my_theme(self, request):
        if request.user.role != 'intern':
            return Response(
                {"detail": "Seuls les stagiaires peuvent accéder à cette route."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Grâce au OneToOneField dans User
        if not hasattr(request.user, 'assigned_theme') or request.user.assigned_theme is None:
            return Response(
                {"detail": "Aucun thème attribué."},
                status=status.HTTP_NOT_FOUND
            )
        
        serializer = self.get_serializer(request.user.assigned_theme)
        return Response(serializer.data)

    # Thèmes disponibles
    @action(detail=False, methods=['get'])
    def available(self, request):
        themes = Theme.objects.available()  # grâce au manager
        serializer = self.get_serializer(themes, many=True)
        return Response(serializer.data)

    # Thèmes attribués
    @action(detail=False, methods=['get'])
    def assigned(self, request):
        themes = Theme.objects.assigned()
        serializer = self.get_serializer(themes, many=True)
        return Response(serializer.data)

    # Attribution d’un thème
    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        theme = self.get_object()
        if not theme.is_assignable:
            return Response(
                {"detail": "Ce thème n'est pas attribuable."},
                status=status.HTTP_400_BAD_REQUEST
            )

        intern_id = request.data.get('intern_id')
        if not intern_id:
            return Response(
                {"detail": "intern_id est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        intern = get_object_or_404(User, id=intern_id, role='intern')
        
        if intern.assigned_theme is not None:
            return Response(
                {"detail": "Ce stagiaire a déjà un thème."},
                status=status.HTTP_400_BAD_REQUEST
            )

        theme.assign_to_intern(intern)
        return Response({"detail": "Thème attribué avec succès."})

    # Désattribution
    @action(detail=True, methods=['post'], url_path='unassign')
    def unassign(self, request, pk=None):
        theme = self.get_object()
        if not theme.assigned_to:
            return Response(
                {"detail": "Ce thème n'est pas attribué."},
                status=status.HTTP_400_BAD_REQUEST
            )
        theme.unassign()
        return Response({"detail": "Thème désattribué."})

class AvailableInternViewSet( viewsets.ModelViewSet):
    """
    ViewSet pour les stagiaires disponibles (sans thème attribué).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AvailableInternSerializer
    
    def get_queryset(self):
        """Retourne les stagiaires sans thème attribué."""
        return User.objects.filter(
            role='intern',
            is_active=True
        ).exclude(
            assigned_theme__isnull=False
        ).select_related('profile')
    
    @action(detail=False, methods=['get'])
    def for_theme(self, request, theme_id=None):
        """
        Stagiaires disponibles pour un thème spécifique.
        """
        theme = get_object_or_404(Theme, pk=theme_id)
        
        if not theme.is_assignable:
            return Response(
                {'detail': ("Ce thème n'est pas attribuable.")},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        interns = self.get_queryset()
        serializer = self.get_serializer(interns, many=True)
        
        return Response(serializer.data)