# projects/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Projet
from .serializers import ProjetSerializer, ProjetListSerializer, ProjetDetailSerializer


# ──────────────────────────────────────────────────────────────
# Permission : SEUL l'admin peut modifier/créer/supprimer
# ──────────────────────────────────────────────────────────────
from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'admin'
        )


# ──────────────────────────────────────────────────────────────
# PROJET VIEWSET – CRUD avec règles strictes
# ──────────────────────────────────────────────────────────────
class ProjetViewSet(viewsets.ModelViewSet):
    """
    CRUD complet sur les projets
    → Admin : tout (create, update, delete)
    → Autres rôles : lecture seule des projets "en_cours"
    """
    queryset = Projet.objects.select_related('formation').all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjetListSerializer
        if self.action == 'retrieve':
            return ProjetDetailSerializer
        return ProjetSerializer

    # =================================================================
    # PERMISSIONS : SEUL L'ADMIN PEUT ÉCRIRE
    # =================================================================
    def get_permissions(self):
        """
        - list / retrieve → tout le monde (mais filtré dans get_queryset)
        - create / update / partial_update / destroy → SEUL admin
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        else:
            # create, update, partial_update, destroy
            return [IsAdminUser()]

    # =================================================================
    # FILTRAGE INTELLIGENT : non-admin → voit uniquement "en_cours"
    # =================================================================
    def get_queryset(self):
        user = self.request.user

        if getattr(user, 'role', None) == 'admin':
            # Admin voit tout
            return Projet.objects.select_related('formation') \
                                 .all() \
                                 .order_by('-date_creation')

        # TOUS les autres rôles → uniquement les projets en cours
        return Projet.objects.select_related('formation') \
                             .filter(statut='en_cours') \
                             .order_by('-date_creation')

    # =================================================================
    # CRUD CLASSIQUE (seul admin passe grâce à get_permissions)
    # =================================================================
    def perform_create(self, serializer):
        """Admin seulement (déjà bloqué par permission)"""
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    # =================================================================
    # ACTIONS UTILES (optionnelles mais très pratiques)
    # =================================================================
    @action(detail=False, methods=['get'])
    def en_cours(self, request):
        """Liste explicite des projets en cours (même chose que list pour non-admin)"""
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def count(self, request):
        """Nombre de projets visibles"""
        total = self.get_queryset().count()
        return Response({"count": total})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Stats simples visibles par tous"""
        qs = self.get_queryset()
        return Response({
            "total_visible": qs.count(),
            "avec_fichier": qs.exclude(fichier__isnull=True).count(),
            "par_formation": list(qs.values('formation__nom')
                                    .annotate(count=Count('id'))
                                    .order_by('-count'))
        })