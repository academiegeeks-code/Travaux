# bcef_innovation_backend/api_urls.py

from django.urls import path, include

urlpatterns = [
    path('', include('user_management.urls')),
    path('', include('works_management.urls')),
    # Add any other API app URLs here
]