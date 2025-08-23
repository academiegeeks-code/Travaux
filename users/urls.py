# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views.auth import LoginView, LogoutView
from users.views.security import (ActivationView, PasswordResetRequestView,
                                  PasswordResetConfirmView, PasswordChangeView)
from users.views.profiles import (ProfileView, AdminProfileView)
from users.views.visitors import (SuggestionView)
from users.views.stats import (StatsView)
from users.views.stagiaire_management import (StagiaireListCreateView, StagiaireDetailUpdateView,
                                            StagiaireDeleteViewSoftDelete, BulkStagiaireImportView)
from users.views.supervisor_manage import (SupervisorListCreateView, SupervisorDetailUpdateView,
                                        SupervisorDeleteViewSoftDelete, BulkSupervisorImportView)

app_name = 'users'

urlpatterns = [
    # AUTHENTIFICATION
    path('api/login/', LoginView.as_view(), name='user-login'),
    path('api/logout/', LogoutView.as_view(), name='user-logout'),
    path('jwt/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('activate/', ActivationView.as_view(), name='user-activation'),

    # MOTS DE PASSE
    path('password/reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),

    # PROFILS
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('admin/profile/<int:pk>/', AdminProfileView.as_view(), name='profilea'),

    # STAGIAIRES CRUD
    path('stagiaires/', StagiaireListCreateView.as_view(), name='stagiaire-list-create'),
    path('stagiaires/<int:pk>/', StagiaireDetailUpdateView.as_view(), name='stagiaire-detail-update'),
    path('stagiaires/delete/<int:pk>/', StagiaireDeleteViewSoftDelete.as_view(), name='stagiaire-delete'),
    path('stagiaires/import/', BulkStagiaireImportView.as_view(), name='stagiaire-import'),

    # SUPERVISEURS CRUD
    path('superviseurs/', SupervisorListCreateView.as_view(), name='supervisor-list-create'),
    path('superviseurs/<int:pk>/', SupervisorDetailUpdateView.as_view(), name='supervisor-detail-update'),
    path('superviseurs/delete/<int:pk>/', SupervisorDeleteViewSoftDelete.as_view(), name='supervisor-delete'),
    path('superviseurs/import/', BulkSupervisorImportView.as_view(), name='supervisor-import'),

    # SUGGESTIONS & STATS
    path('suggestions/', SuggestionView.as_view(), name='user-suggestions'),
    path('stats/', StatsView.as_view(), name='user-stats'),
]