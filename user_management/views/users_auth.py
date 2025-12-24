# users/views/auth.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from ..mixins import LoggingMixin, RateLimitMixin
from user_management.Serializers.User_Serializer import CustomTokenObtainPairSerializer
from django.core.cache import cache  # Pour stocker les compteurs échecs ( avec Redis)
from .utils import verify_captcha
# users/views/auth.py
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.utils.timezone import now

FAILED_LOGIN_PREFIX = "failed_login_attempts:"
FAILED_LOGIN_EXPIRY = 60 * 15  # 15 minutes d'expiration du compteur

def get_failed_login_attempts(email):
    key = FAILED_LOGIN_PREFIX + email.lower()
    return cache.get(key, 0)

def increment_failed_login_attempts(email):
    key = FAILED_LOGIN_PREFIX + email.lower()
    attempts = cache.get(key, 0)
    attempts += 1
    cache.set(key, attempts, timeout=FAILED_LOGIN_EXPIRY)
    return attempts

def reset_failed_login_attempts(email):
    key = FAILED_LOGIN_PREFIX + email.lower()
    cache.delete(key)

class LoginView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [AllowAny]
    rate_limit = 10
    rate_period = 60
    rate_scope = 'ip'

    MAX_FAILED_ATTEMPTS = 3

    def post(self, request):
        self.setup_logging_context(request)

        allowed, rate_info = self.check_rate_limit(request, action='login')
        if not allowed:
            self.log_security_event('login_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        # 1. Vérifier le token captcha
        captcha_token = request.data.get('captcha_token')
        if not captcha_token or not verify_captcha(captcha_token):
            self.log_error('login_failed_captcha', Exception('Invalid captcha'), {
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({'detail': 'Please validate the captcha first.'}, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            self.log_error('login_failed', Exception('Missing credentials'), {
                'email': email or 'none',
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Récupérer nombre d'échecs stocké
        failed_attempts = get_failed_login_attempts(email)

        # 3. Si trop d'échecs, demander OTP avant login
        if failed_attempts >= self.MAX_FAILED_ATTEMPTS:
            self.log_security_event('login_otp_required', {'email': email, 'failed_attempts': failed_attempts})
            return Response({
                'detail': 'Multi-factor authentication required.', 
                'require_otp': True
            }, status=status.HTTP_403_FORBIDDEN)

        # 4. Authentification
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            user.last_login = now()
            user.save(update_fields=['last_login'])
            if user.is_active:
                # Générer les tokens JWT
                refresh = RefreshToken.for_user(user)
                
                # Mettre à jour les informations de connexion
                ip_addr = request.META.get('REMOTE_ADDR')
                user_agent = request.META.get('HTTP_USER_AGENT', '<unknown>')
                
                # Reset compteur échecs en cas de succès
                reset_failed_login_attempts(email)
                
                # Log de succès
                self.log_success('login_successful', {
                    'email': user.email,
                    'ip_address': ip_addr,
                    'user_agent': user_agent
                })
                
                # 🔥 RETOURNER LES INFORMATIONS DE REDIRECTION
                return Response({
                    'success': True,
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser
                    }
                }, status=status.HTTP_200_OK)
            else:
                self.log_error('login_failed_inactive', Exception('Inactive account'), {
                    'email': email,
                    'ip_address': request.META.get('REMOTE_ADDR')
                })
                return Response({
                    'detail': 'Account is inactive.'
                }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            # Incrémenter le compteur d'échecs
            increment_failed_login_attempts(email)
            self.log_error('login_failed', Exception('Invalid credentials'), {
                'email': email,
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({
                'detail': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
class LogoutView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [IsAuthenticated]
    rate_limit = 20
    rate_period = 60
    rate_scope = 'user'

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='logout')
        if not allowed:
            self.log_security_event('logout_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        refresh_token = request.data.get('refresh')
        if not refresh_token:
            self.log_error('logout_failed', Exception('No refresh token provided'), {
                'user': request.user.email,
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            self.log_success('logout_successful', {
                'user': request.user.email,
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT', '<unknown>')
            })
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except TokenError as e:
            self.log_error('logout_failed', e, {
                'user': request.user.email,
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({'detail': 'Invalid refresh token.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            self.log_error('logout_error', e, {
                'user': request.user.email,
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({'detail': 'Logout failed due to server error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)