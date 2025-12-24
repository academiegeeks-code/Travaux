# users_management/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views.users_auth import LoginView, LogoutView
from .views.users_list import UserListView
from .views.users_security import (ActivationView, PasswordResetRequestView,
                                  PasswordResetConfirmView, PasswordChangeView)

from user_management.views.users_crud import ( UserDetailView, BulkUserImportView, SingleUserCreateView,
                                            UserExportView)
from .views.utils import verify_captcha                            
from rest_framework_simplejwt.views import TokenObtainPairView  
from user_management.views.views import me_view
                                   

app_name = 'user_management'


urlpatterns = [
    # chemin pour obtenir un token d'authentification
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # chemin pour rafraichir le token d'authentification
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # chemin vers la verification captcha
    path("verify-captcha", verify_captcha, name="verify_captcha"),
    # chemin pour se connecter et se deconnecter
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    # chemin d'activation de compte utilisateur
    path('activate/', ActivationView.as_view(), name='user-activation'),

    # MOTS DE PASSE
    # path('password/reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    # path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # path('password/change/', PasswordChangeView.as_view(), name='password_change'),

    # ADMINISTRATION
    # path('admin/profile/<int:pk>/', AdminProfileView.as_view(), name='profilea'),

# Users CRUD
    path('users/', UserListView.as_view(), name='user-list-create'),
    # chemin pour créer manuellement un utilisateur
    path('users/usercreate/', SingleUserCreateView.as_view(), name='single-user-create'),
    # chemin pour récupérer, mettre à jour et supprimer un utilisateur spécifique
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail-update'),
    # chemin pour l'import en masse d'utilisateurs
    path('users/bulk-import/', BulkUserImportView.as_view(), name='user-import'),
    # chemin pour l'export des utilisateurs
    path('users/bulk-export/', UserExportView.as_view(), name='user-export'),

    # SUGGESTIONS & STATS
    #path('suggestions/', SuggestionView.as_view(), name='user-suggestions'),
    #path('stats/', StatsView.as_view(), name='user-stats'),
    path('users/me/', me_view, name='user-me'),
]