from django.core.cache import cache
from django.conf import settings
import sys, os, django

# Ajouter le répertoire parent au chemin Python
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# cleanup_cache.py

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bcef_innovation_backend.settings')
django.setup()
# Testez avec une vue minimaliste d'abord
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class TestBulkImportView(APIView):
    """Vue de test sans mixins"""
    
    def get(self, request):
        return Response({"message": "GET works!"}, status=status.HTTP_200_OK)
    
    def post(self, request):
        return Response({"message": "POST works!", "data": request.data}, status=status.HTTP_200_OK)