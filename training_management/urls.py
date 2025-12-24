# training_management/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework import permissions

from . import views


# Router pour les ViewSets
router = DefaultRouter()
router.register(r'formation-types', views.FormationTypeViewSet, basename='formation-type')
router.register(r'sessions', views.FormationSessionViewSet, basename='session')
router.register(r'supports', views.SupportFormationViewSet, basename='support')

urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
    
    # Endpoints supplémentaires pour les statistiques et rapports
    #path('api/stats/', views.FormationStatsView.as_view(), name='formation-stats'),
    #path('api/export/sessions/', views.ExportSessionsView.as_view(), name='export-sessions'),
]

# URLs détaillées pour référence
"""
ENDPOINTS DISPONIBLES :

FORMATION TYPES (formation-types/)
---------------------------------
GET    /api/formation-types/                    # Liste des types de formation
POST   /api/formation-types/                    # Créer un type de formation
GET    /api/formation-types/{id}/               # Détails d'un type de formation
PUT    /api/formation-types/{id}/               # Modifier un type de formation
PATCH  /api/formation-types/{id}/               # Modifier partiellement
DELETE /api/formation-types/{id}/               # Supprimer un type de formation
GET    /api/formation-types/{id}/supports/      # Supports d'une formation

SESSIONS (sessions/)
-------------------
GET    /api/sessions/                           # Liste des sessions
POST   /api/sessions/                           # Créer une session
GET    /api/sessions/{id}/                      # Détails d'une session
PUT    /api/sessions/{id}/                      # Modifier une session
PATCH  /api/sessions/{id}/                      # Modifier partiellement
DELETE /api/sessions/{id}/                      # Supprimer une session

ACTIONS CUSTOM POUR LES SESSIONS :
GET    /api/sessions/calendar/                  # Données pour le calendrier
GET    /api/sessions/mes_sessions/              # Sessions du formateur connecté
GET    /api/sessions/a_venir/                   # Sessions à venir
GET    /api/sessions/en_cours/                  # Sessions en cours
GET    /api/sessions/terminees/                 # Sessions terminées
GET    /api/sessions/formateurs_eligibles/      # Liste des formateurs éligibles
POST   /api/sessions/{id}/update_statut/        # Mise à jour auto du statut
PATCH  /api/sessions/{id}/update_statut/        # Mise à jour manuelle du statut

SUPPORTS (supports/)
-------------------
GET    /api/supports/                           # Liste des supports
POST   /api/supports/                           # Créer un support
GET    /api/supports/{id}/                      # Détails d'un support
PUT    /api/supports/{id}/                      # Modifier un support
PATCH  /api/supports/{id}/                      # Modifier partiellement
DELETE /api/supports/{id}/                      # Supprimer un support
GET    /api/supports/by_formation/              # Supports par formation

STATISTIQUES ET RAPPORTS :
GET    /api/stats/                              # Statistiques globales
GET    /api/export/sessions/                    # Export des sessions


"""