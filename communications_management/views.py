# communication_management/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Announcement
from .serializers import (
    AnnouncementSerializer, 
    AnnouncementCreateSerializer,
    AnnouncementUpdateSerializer
)

class IsAdminUser(permissions.BasePermission):
    """
    Permission personnalisée pour n'autoriser que les administrateurs
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des annonces
    """
    queryset = Announcement.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'create':
            return AnnouncementCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AnnouncementUpdateSerializer
        return AnnouncementSerializer

    def get_queryset(self):
        """
        Retourne les annonces visibles selon le rôle de l'utilisateur
        """
        user = self.request.user
        
        # Pour les admins : voir toutes les annonces
        if user.role == 'admin':
            return Announcement.objects.all().order_by('-publication_date', '-priority')
        
        # Pour les autres utilisateurs : seulement les annonces publiées et actives
        return Announcement.objects.filter(
            is_active=True,
            publication_date__lte=timezone.now()
        ).order_by('-publication_date', '-priority')

    def get_permissions(self):
        """
        Instancie et retourne la liste des permissions requises pour cette vue
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Assigne l'utilisateur courant comme créateur de l'annonce"""
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        """Liste des annonces avec statistiques"""
        response = super().list(request, *args, **kwargs)
        
        # Ajouter des métadonnées pour les admins
        if request.user.role == 'admin':
            total_announcements = Announcement.objects.count()
            active_announcements = Announcement.objects.filter(is_active=True).count()
            upcoming_announcements = Announcement.objects.filter(
                publication_date__gt=timezone.now()
            ).count()
            
            # CORRECTION : Vérifier si response.data est un dictionnaire (avec pagination)
            # ou une liste (sans pagination)
            if isinstance(response.data, list):
                # Sans pagination - créer un nouveau format de réponse
                return Response({
                    'results': response.data,
                    'metadata': {
                        'total': total_announcements,
                        'active': active_announcements,
                        'upcoming': upcoming_announcements
                    }
                })
            else:
                # Avec pagination - ajouter les métadonnées au dictionnaire existant
                response.data['metadata'] = {
                    'total': total_announcements,
                    'active': active_announcements,
                    'upcoming': upcoming_announcements
                }
        
        return response

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def publish(self, request, pk=None):
        """Action pour publier immédiatement une annonce"""
        announcement = self.get_object()
        announcement.publication_date = timezone.now()
        announcement.is_active = True
        announcement.save()
        
        serializer = self.get_serializer(announcement)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def unpublish(self, request, pk=None):
        """Action pour dépublier une annonce"""
        announcement = self.get_object()
        announcement.is_active = False
        announcement.save()
        
        serializer = self.get_serializer(announcement)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_announcements(self, request):
        """Liste des annonces créées par l'utilisateur courant (admin seulement)"""
        if request.user.role != 'admin':
            return Response(
                {"detail": "Vous n'avez pas la permission d'accéder à cette ressource."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        announcements = Announcement.objects.filter(created_by=request.user)
        page = self.paginate_queryset(announcements)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(announcements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def active(self, request):
        """Liste des annonces actives (pour tous les utilisateurs)"""
        active_announcements = Announcement.objects.filter(
            is_active=True,
            publication_date__lte=timezone.now()
        ).order_by('-publication_date', '-priority')
        
        page = self.paginate_queryset(active_announcements)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(active_announcements, many=True)
        return Response(serializer.data)