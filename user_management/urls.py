# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views.users_auth import LoginView, LogoutView
from .views.users_security import (ActivationView, PasswordResetRequestView,
                                  PasswordResetConfirmView, PasswordChangeView)
#from .views.visitors import (SuggestionView)
#from .views.users_stats import (StatsView)
from .views.users_mg import (UserListCreateView, UserDetailView, BulkUserImportView, UserExportView)
from .views.utils import verify_captcha     
#from user_management.views import AdministrationViews                        
from rest_framework_simplejwt.views import TokenObtainPairView  
from .tests import TestBulkImportView                                     

app_name = 'user_management'


urlpatterns = [

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # AUTHENTIFICATION
    path("verify-captcha", verify_captcha, name="verify_captcha"),
    path('login/', LoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('activate/', ActivationView.as_view(), name='user-activation'),

    # MOTS DE PASSE
    # path('password/reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    # path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # path('password/change/', PasswordChangeView.as_view(), name='password_change'),

    # ADMINISTRATION
    # path('administration/', AdministrationViews, name='admin_panel'),
    # path('admin/profile/<int:pk>/', AdminProfileView.as_view(), name='profilea'),

    # STAGIAIRES CRUD

    # Users CRUD
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    #path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail-update'),
    path('users/test-import/', TestBulkImportView.as_view(), name='test-import'),
    path('users/bulk-import/', BulkUserImportView.as_view(), name='user-import'),
    #path('users/import/', UserExportView.as_view(), name='user-export'),

    # SUGGESTIONS & STATS
    #path('suggestions/', SuggestionView.as_view(), name='user-suggestions'),
    #path('stats/', StatsView.as_view(), name='user-stats'),
]