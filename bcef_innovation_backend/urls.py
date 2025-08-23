# bcef_innovation_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from . import views
app_name = "users" 
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),  # Inclut toutes les URLs de users/urls.py
    path('', views.home, name='home'),
]