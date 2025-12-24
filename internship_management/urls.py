# internship_management/urls.py  (ou dans le urls.py principal)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThemeViewSet, AvailableInternViewSet

# Création du router
router = DefaultRouter()
router.register(r'themes', ThemeViewSet, basename='theme')
router.register(r'available-interns', AvailableInternViewSet, basename='available-intern')

urlpatterns = [
    path('', include(router.urls)),  # ← Très important : /api/themes/ et /api/available-interns/
]