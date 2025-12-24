from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.db.models import Q, Count
from .models import FormationType, FormationSession, SupportFormation
from user_management.models import User
from .serializers import (
    FormationTypeSerializer, FormationTypeDetailSerializer,
    FormationSessionSerializer, FormationSessionListSerializer,
    FormationSessionCalendarSerializer, FormationSessionStatutSerializer,
    FormationSessionDetailSerializer, SupportFormationSerializer
)
from .permissions import (
    CanViewFormations, CanManageFormations,
    CanViewSessions, CanManageSessions, IsFormateurOrReadOnly
)


class FormationTypeViewSet(viewsets.ModelViewSet):
    queryset = FormationType.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FormationTypeDetailSerializer
        return FormationTypeSerializer
    
    def get_permissions(self):
        """Permissions granulaires selon l'action"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [CanViewFormations]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [CanManageFormations]
        else:
            permission_classes = [CanViewFormations]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Retourne la liste des FormationType avec :
        - nombre_sessions (annoté)
        - supports_count (annoté)
        Filtrage selon le rôle de l'utilisateur
        """
        from django.db.models import Count

        # On part toujours de FormationType
        queryset = FormationType.objects.all()

        # LES 2 LIGNES MAGIQUES QUI FONT TOUT FONCTIONNER
        queryset = queryset.annotate(
            nombre_sessions=Count('sessions', distinct=True),
            supports_count=Count('supports', distinct=True)
        )

        user = self.request.user

        # Admins voient tout
        if user.role == 'admin':
            return queryset

        # Tous les stagiaires (intern) voient les formations
        if user.role == 'intern':
            return queryset

        # Superviseurs ne voient rien
        if user.role == 'supervisor':
            return FormationType.objects.none()

        # Par défaut (visitor, etc.) → on montre tout aussi
        return queryset

    def _is_formateur(self, user):
        """Vérifie si un utilisateur intern peut être formateur (au moins 1 mois de stage)"""
        if user.role != 'intern':
            return False
        
        # Vérifier si l'utilisateur a au moins 1 mois d'ancienneté
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        return user.date_joined <= one_month_ago

    def create(self, request, *args, **kwargs):
        """Création avec vérification de permission explicite"""
        if not request.user.has_perm('training_management.manage_formations'):
            return Response(
                {"error": "Permission refusée. Seuls les administrateurs peuvent créer des formations."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def supports(self, request, pk=None):
        """Récupérer les supports d'une formation"""
        try:
            formation_type = self.get_object()
            supports = formation_type.supports.all()  # Utilisez la relation related_name
            
            # Si la table n'existe pas encore, retournez des données vides
            if not supports:
                return Response([])
                
            serializer = SupportFormationSerializer(supports, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            # En cas d'erreur (table inexistante), retournez des données vides
            print(f"Erreur lors de la récupération des supports: {e}")
            return Response([])

class FormationSessionViewSet(viewsets.ModelViewSet):
    queryset = FormationSession.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FormationSessionListSerializer
        elif self.action == 'calendar':
            return FormationSessionCalendarSerializer
        elif self.action == 'update_statut':
            return FormationSessionStatutSerializer
        elif self.action == 'retrieve':
            return FormationSessionDetailSerializer
        return FormationSessionSerializer
    
    def get_permissions(self):
        """Permissions selon l'action et l'objet"""
        if self.action in ['list', 'retrieve', 'calendar', 'a_venir', 'en_cours', 'terminees']:
            permission_classes = [CanViewSessions]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [CanManageSessions]
        elif self.action in ['update_statut', 'mes_sessions']:
            permission_classes = [IsFormateurOrReadOnly]
        else:
            permission_classes = [CanViewSessions]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filtrage intelligent selon le rôle"""
        user = self.request.user
        
        if user.role == 'admin':
            return FormationSession.objects.all()
        elif user.role == 'intern':
            # Formateurs (intern avec +1 mois) voient leurs sessions + toutes les sessions
            if self._is_formateur(user):
                return FormationSession.objects.filter(
                    models.Q(formateur=user) | 
                    models.Q()  # Toutes les sessions
                ).distinct()
            else:
                # Stagiaires normaux voient toutes les sessions mais ne peuvent pas être formateurs
                return FormationSession.objects.all()
        elif user.role == 'supervisor':
            # Superviseurs ne voient PAS les sessions (rôle externe)
            return FormationSession.objects.none()
        else:
            # Visiteurs voient toutes les sessions
            return FormationSession.objects.all()

    def _is_formateur(self, user):
        """Vérifie si un utilisateur intern peut être formateur (au moins 1 mois de stage)"""
        if user.role != 'intern':
            return False
        
        # Vérifier si l'utilisateur a au moins 1 mois d'ancienneté
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        return user.date_joined <= one_month_ago

    def _get_formateurs_queryset(self):
        """Retourne le queryset des utilisateurs pouvant être formateurs"""
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        return User.objects.filter(
            role='intern',
            is_active=True,
            date_joined__lte=one_month_ago  # Au moins 1 mois d'ancienneté
        )

    def perform_create(self, serializer):
        """Création avec vérification des permissions pour formateur"""
        user = self.request.user
        
        # Vérifier si un formateur est spécifié
        formateur = serializer.validated_data.get('formateur')
        
        if formateur:
            # Vérifier que le formateur assigné est éligible
            if not self._is_formateur(formateur):
                raise PermissionDenied(
                    "Le formateur assigné doit être un stagiaire avec au moins 1 mois d'ancienneté."
                )
            
            # Vérifier les permissions pour assigner un formateur
            if user.role == 'admin':
                if not user.has_perm('training_management.assign_formateur'):
                    raise PermissionDenied("Permission refusée pour assigner un formateur.")
            elif user.role == 'intern':
                # Un formateur ne peut s'assigner que lui-même
                if formateur != user:
                    raise PermissionDenied("Vous ne pouvez vous assigner que vous-même comme formateur.")
            else:
                raise PermissionDenied("Permission refusée pour assigner un formateur.")
        
        # Auto-assignation pour les formateurs (intern éligibles)
        elif user.role == 'intern' and self._is_formateur(user):
            serializer.validated_data['formateur'] = user
        
        # Si admin crée sans formateur, laisser null ou lever une erreur
        elif user.role == 'admin' and not formateur:
            # Optionnel : forcer l'assignation d'un formateur
            # raise PermissionDenied("Un formateur doit être assigné à la session.")
            pass
            
        serializer.save()

    @action(detail=True, methods=['post', 'patch'])
    def update_statut(self, request, pk=None):
        """Mettre à jour le statut d'une session"""
        session = self.get_object()
        
        # Vérifier que l'utilisateur est le formateur de cette session ou admin
        if (request.user.role != 'admin' and 
            (session.formateur != request.user or not self._is_formateur(request.user))):
            return Response(
                {"error": "Seul le formateur assigné de cette session peut modifier son statut."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'POST':
            # Mise à jour automatique du statut
            session.update_statut()
        elif request.method == 'PATCH':
            # Mise à jour manuelle du statut
            serializer = self.get_serializer(session, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        
        serializer = FormationSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mes_sessions(self, request):
        """Sessions du formateur connecté (intern avec +1 mois)"""
        if request.user.role != 'intern' or not self._is_formateur(request.user):
            return Response(
                {"error": "Réservé aux formateurs (stagiaires avec au moins 1 mois d'ancienneté)"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        sessions = FormationSession.objects.filter(formateur=request.user)
        page = self.paginate_queryset(sessions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def formateurs_eligibles(self, request):
        """Liste des stagiaires éligibles comme formateurs"""
        if request.user.role not in ['admin', 'intern']:
            return Response(
                {"error": "Accès non autorisé"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        formateurs = self._get_formateurs_queryset()
        data = [
            {
                'id': user.id,
                'nom_complet': user.get_full_name(),
                'email': user.email,
                'date_inscription': user.date_joined,
                'anciennete_mois': round((timezone.now() - user.date_joined).days / 30, 1)
            }
            for user in formateurs
        ]
        return Response(data)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Endpoint pour les données calendaire"""
        sessions = self.get_queryset()
        page = self.paginate_queryset(sessions)
        if page is not None:
            serializer = FormationSessionCalendarSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = FormationSessionCalendarSerializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def a_venir(self, request):
        """Sessions à venir"""
        sessions = self.get_queryset().filter(
            date_debut__gte=timezone.now(),
            statut='PLAN'
        ).order_by('date_debut')
        
        page = self.paginate_queryset(sessions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def en_cours(self, request):
        """Sessions en cours"""
        sessions = self.get_queryset().filter(statut='ENCOURS').order_by('date_debut')
        
        page = self.paginate_queryset(sessions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def terminees(self, request):
        """Sessions terminées"""
        sessions = self.get_queryset().filter(statut='TERMINEE').order_by('-date_fin')
        
        page = self.paginate_queryset(sessions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)


class SupportFormationViewSet(viewsets.ModelViewSet):
    queryset = SupportFormation.objects.all()
    serializer_class = SupportFormationSerializer
    
    def get_permissions(self):
        """Permissions pour les supports"""
        if self.action in ['list', 'retrieve', 'by_formation']:
            permission_classes = [CanViewFormations]
        else:
            permission_classes = [CanManageFormations]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filtrage des supports selon le rôle"""
        queryset = SupportFormation.objects.all()
        # AJOUTE CETTE LIGNE → C’EST TOUT !
        queryset = queryset.annotate(nombre_sessions=Count('sessions'))
        
        user = self.request.user
        formation_type_id = self.request.query_params.get('formation_type')
        
        queryset = SupportFormation.objects.all()
        
        # Filtre par type de formation si spécifié
        if formation_type_id:
            queryset = queryset.filter(formation_type_id=formation_type_id)
        
        # Gestion des accès par rôle
        if user.role == 'admin':
            # Admins voient tout
            pass
        elif user.role == 'intern':
            # Tous les stagiaires (formateurs ou non) voient les supports
            pass
        elif user.role == 'supervisor':
            # Superviseurs ne voient PAS les supports (rôle externe)
            queryset = SupportFormation.objects.none()
        # Autres rôles (visitor, etc.) voient tous les supports par défaut
            
        return queryset

    def _is_formateur(self, user):
        """Vérifie si un utilisateur intern peut être formateur (au moins 1 mois de stage)"""
        if user.role != 'intern':
            return False
        
        # Vérifier si l'utilisateur a au moins 1 mois d'ancienneté
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        return user.date_joined <= one_month_ago

    def perform_create(self, serializer):
        """Création avec vérification des permissions"""
        user = self.request.user
        
        if not user.has_perm('training_management.manage_formations'):
            raise PermissionDenied("Permission refusée pour créer des supports.")
            
        serializer.save()

    @action(detail=False, methods=['get'])
    def by_formation(self, request):
        """Supports par formation"""
        formation_type_id = request.query_params.get('formation_type')
        
        if not formation_type_id:
            return Response(
                {"error": "Le paramètre formation_type est requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # ✅ CORRECTION: Utilisez directement le queryset au lieu de créer un ViewSet
            formation_type_exists = FormationType.objects.filter(
                id=formation_type_id
            ).exists()
            
            if not formation_type_exists:
                return Response(
                    {"error": "Formation non trouvée"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            supports = SupportFormation.objects.filter(formation_type_id=formation_type_id)
            page = self.paginate_queryset(supports)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
                
            serializer = self.get_serializer(supports, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {"error": "ID de formation invalide"}, 
                status=status.HTTP_400_BAD_REQUEST
            )