from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework.permissions import IsAuthenticated
from user_management.Serializers.User_Serializer import (
    ActivationSerializer,
    UserSerializer)
from user_management.Serializers.passwords import (
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from user_management.mixins.LoggingMixin import LoggingMixin
from user_management.mixins.RateLimitMixin import RateLimitMixin

class CompatibleMetaclass(type(APIView)):
    pass
"""🔓 ActivationView — Activation sécurisée via token"""
class ActivationView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = []  # Public
    authentication_classes = []  # Pas d'authentification requise
    rate_limit = 100  # 10O tentatives en dev par 5 minutes (à ajuster en prod)
    rate_period = 300  # 5 minutes en secondes
    rate_scope = 'ip'

    def post(self, request):
        # DEBUG: Affichez les données reçues
        print("Données reçues:", request.data)
        print("Headers:", dict(request.headers))
        
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='activation')
        if not allowed:
            self.log_security_event('activation_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)  # 2 arguments

        serializer = ActivationSerializer(data=request.data)
        # DEBUG: Vérifiez la validation
        print("Serializer is_valid:", serializer.is_valid())
        if serializer.is_valid():
            print("Erreurs de validation:", serializer.errors)
            try:
                user = serializer.activate()
                
                self.log_success('account_activated', {
                    'user': user.email,
                    'ip': self._get_client_ip(request)
                })
                
                return Response({
                    'detail': 'Compte activé avec succès. Vous pouvez maintenant vous connecter.',
                    'email': user.email
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                # Gestion d'erreur pendant l'activation
                self.log_error('activation_failed', e, {'email': request.data.get('email')})
                return Response(
                    {'detail': 'Erreur lors de l\'activation.'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
       # Le serializer est invalide
            self.log_error('activation_invalid', Exception(serializer.errors))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        
                
"""🔐 PasswordResetRequestView — Demande de réinitialisation"""
class PasswordResetRequestView(LoggingMixin, RateLimitMixin, APIView):
    rate_limit = 5
    rate_period = 3600
    rate_scope = 'ip'

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='password_reset')
        if not allowed:
            self.log_security_event('password_reset_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            self.log_success('password_reset_requested', {'email': request.data.get('email')})
            return Response({'detail': 'Password reset email sent.'}, status=status.HTTP_200_OK)

        self.log_error('password_reset_invalid', ValidationError(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


"""🔒 PasswordResetConfirmView — Confirmation du nouveau mot de passe"""
class PasswordResetConfirmView(LoggingMixin, RateLimitMixin, APIView):
    rate_limit = 5
    rate_period = 3600
    rate_scope = 'ip'

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='password_reset_confirm')
        if not allowed:
            self.log_security_event('password_reset_confirm_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            self.log_success('password_reset_confirmed', {
                'user_id': serializer.validated_data.get('user_id', 'unknown')
            })
            return Response({'detail': 'Password reset successful.'}, status=status.HTTP_200_OK)

        self.log_error('password_reset_confirm_invalid', ValidationError(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


"""🔑 PasswordChangeView — Changement de mot de passe pour utilisateur connecté"""
class PasswordChangeView(LoggingMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        self.setup_logging_context(request)
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            self.log_error('password_change_missing_fields', ValidationError('Missing fields'))
            return Response({'detail': 'Both old and new passwords are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            self.log_security_event('password_change_wrong_old_password', {'user': user.email})
            return Response({'detail': 'Old password is incorrect.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            validate_password(new_password, user)
            user.set_password(new_password)
            user.save()
            self.log_success('password_changed', {'user': user.email})
            return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        except ValidationError as e:
            self.log_error('password_change_validation_failed', e)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
