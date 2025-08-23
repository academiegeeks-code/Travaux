# users/views/auth.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from ..mixins import LoggingMixin, RateLimitMixin
from users.serializers import CustomTokenObtainPairSerializer

class LoginView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [AllowAny]
    rate_limit = 10
    rate_period = 60
    rate_scope = 'ip'

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='login')
        if not allowed:
            self.log_security_event('login_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            self.log_error('login_failed', Exception('Missing credentials'), {
                'email': email or 'none',
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CustomTokenObtainPairSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            refresh = RefreshToken.for_user(user)
            ip_addr = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '<unknown>')
            user.last_login_ip = ip_addr
            user.save(update_fields=['last_login_ip'])
            self.log_success('login_successful', {
                'email': user.email,
                'ip_address': ip_addr,
                'user_agent': user_agent
            })
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            self.log_error('login_failed', e, {
                'email': email,
                'ip_address': request.META.get('REMOTE_ADDR')
            })
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

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