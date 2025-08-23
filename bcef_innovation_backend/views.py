# bcef_innovation_backend/views.py
from django.http import JsonResponse

def home(request):
    return JsonResponse({'message': 'Welcome to BCEF Innovation API!'})