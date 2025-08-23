from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.serializers import UserSerializer
from users.permissions import HasPermissionPermission, Permission
from users.mixins import LoggingMixin, RateLimitMixin
import logging

class AdminProfileView(LoggingMixin, RateLimitMixin, APIView):
    """
    Panneau d'administration des utilisateurs: réservé aux administrateurs.
    Vue GET/PUT avec rate limiting, logging enrichi et audit complet.
    """
    permission_classes = [IsAuthenticated, HasPermissionPermission]
    required_permission = Permission.MANAGE_USERS
    rate_limit = {"GET": "30/m", "PUT": "10/m"}
    rate_scope = 'user'  # Ou 'ip' selon besoin

    def get(self, request, pk, *args, **kwargs):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='admin_profile_view')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        if not request.user.is_staff:
            self.log_security_event("admin_profile_access_denied", {
                "user": request.user.email
            })
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        self.log_success("admin_profile_viewed")
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='admin_profile_update')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        if not request.user.is_staff:
            self.log_security_event("admin_profile_modify_denied", {
                "user": request.user.email
            })
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            before = {field: getattr(request.user, field) for field in request.data.keys()}
            serializer.save()
            self.log_success("admin_profile_modified", {
                "modified_fields": list(request.data.keys()),
                "before": before,
                "after": request.data
            })
            return Response(serializer.data, status=status.HTTP_200_OK)

        self.log_error("admin_profile_modify_failed", Exception("ValidationError"), {
            "errors": serializer.errors
        })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(LoggingMixin, RateLimitMixin, APIView):
    """
    Vue et modification du profil utilisateur connecté.
    Compatible audit, rate limit et logging enrichi.
    """
    permission_classes = [IsAuthenticated]
    rate_limit = {"GET": "30/m"}
    rate_scope = 'user'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='profile_view')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        self.log_success("profile_viewed", {
            "user": request.user.email
        })
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
