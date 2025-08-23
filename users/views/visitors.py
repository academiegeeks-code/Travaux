from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.permissions import HasPermissionPermission, Permission
from users.serializers import SuggestionSerializer
from users.mixins import LoggingMixin, RateLimitMixin


class SuggestionView(LoggingMixin, RateLimitMixin, APIView):
    """
    Permet aux utilisateurs de soumettre des suggestions,
    avec une limite de 10 requêtes par heure par IP.
    Journalisation complète pour audit et sécurité.
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.SEND_SUGGESTIONS

    # Configuration du rate limit
    rate_limit = 10
    rate_period = 3600  # 1 heure en secondes
    rate_scope = 'ip'   # ou 'user' si tu veux limiter par utilisateur

    def post(self, request):
        self.setup_logging_context(request)

        # Vérification du quota
        rate_response = self.check_rate_limit(request)
        if rate_response:
            self.log_security_event('rate_limit_exceeded', {
                'ip': self._get_client_ip(request),
                'path': request.path
            })
            return rate_response

        serializer = SuggestionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            suggestion = serializer.save()
            self.log_success('suggestion_submitted', {
                'user': request.user.email if request.user.is_authenticated else 'anonymous',
                'domain': suggestion.domain_suggested
            })
            return Response({'detail': 'Suggestion enregistrée.'}, status=status.HTTP_201_CREATED)

        self.log_error('suggestion_invalid', Exception('ValidationError'), {
            'errors': serializer.errors
        })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
