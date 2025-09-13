# bcef_innovation_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from . import views
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('user_management.urls')),  # Inclut toutes les URLs de users/urls.py
    path('', views.home, name='home'),
]