# communication_management/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'announcements', views.AnnouncementViewSet, basename='announcement')

urlpatterns = [
    path('', include(router.urls)),
]

# Les URLs générées par le router :
# GET /api/announcements/ - Liste des annonces
# POST /api/announcements/ - Créer une annonce (admin)
# GET /api/announcements/{id}/ - Détail d'une annonce
# PUT /api/announcements/{id}/ - Modifier une annonce (admin)
# PATCH /api/announcements/{id}/ - Modifier partiellement (admin)
# DELETE /api/announcements/{id}/ - Supprimer une annonce (admin)