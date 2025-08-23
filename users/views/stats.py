from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import User, Suggestion
from users.permissions import HasPermissionPermission, Permission
from users.mixins import LoggingMixin, RateLimitMixin

class StatsView(LoggingMixin, RateLimitMixin, APIView):
    """
    Vue sécurisée pour consulter les statistiques système.
    Inclut journalisation complète et limitation de requêtes.
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.VIEW_STATS

    # Rate limiting: 30 requêtes par heure par IP
    rate_limit = 30
    rate_period = 3600
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)

        rate_response = self.check_rate_limit(request)
        if rate_response:
            self.log_security_event('rate_limit_exceeded', {
                'ip': self._get_client_ip(request),
                'path': request.path
            })
            return rate_response

        try:
            now = timezone.now()
            last_30_days = now - timedelta(days=30)
            last_7_days = now - timedelta(days=7)

            stats = {
                # Core User Metrics
                'total_users': User.objects.count(),
                'active_users': User.objects.filter(is_active=True).count(),
                'new_users_last_30_days': User.objects.filter(date_joined__gte=last_30_days).count(),
                'interns_count': User.objects.filter(role='intern').count(),
                'supervisors_count': User.objects.filter(role='supervisor').count(),
                'visitors_count': User.objects.filter(role='visitor').count(),

                # Engagement Metrics
                'suggestions_count': Suggestion.objects.count(),
                'suggestions_last_7_days': Suggestion.objects.filter(created_at__gte=last_7_days).count(),

                # Activation & Retention
                'pending_activation': User.objects.filter(is_active=False).count(),
                'activated_users_last_30_days': User.objects.filter(is_active=True, date_joined__gte=last_30_days).count(),

                # Strategic Insight
                'supervisor_to_intern_ratio': round(
                    User.objects.filter(role='supervisor').count() / max(User.objects.filter(role='intern').count(), 1), 2
                ),
                'user_growth_rate_last_30_days': round(
                    (User.objects.filter(date_joined__gte=last_30_days).count() / max(User.objects.count() - User.objects.filter(date_joined__gte=last_30_days).count(), 1)) * 100, 2
                ),
            }

            self.log_success('stats_viewed', {
                'user': request.user.email if request.user.is_authenticated else 'anonymous',
                'ip': self._get_client_ip(request),
                'metrics_count': len(stats)
            })
            return Response(stats, status=status.HTTP_200_OK)

        except Exception as e:
            self.log_error('stats_failed', e)
            return Response({'detail': 'Unable to retrieve stats at this time.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
