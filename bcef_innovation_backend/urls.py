from django.contrib import admin
from django.urls import path, include
import bcef_innovation_backend.settings as settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API URLs - Toutes les APIs sous /api/
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Inclure les URLs de user_management directement sous /api/
    path('api/', include('user_management.urls')),
    
    # Inclure les URLs de training_management directement sous /api/
    path('api/', include('training_management.urls')),
    
    # Inclure les URLs de internship_management directement sous /api/
    path('api/', include('internship_management.urls')),
    
    # Inclure les URLs de project_management directement sous /api/
    path('api/', include('project_management.urls')),
    
    # Inclure les URLs de annoucements directement sous /api/
    path('api/', include('communications_management.urls')),
    
    
    # Inclure les URLs de chating directement sous /api/
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)