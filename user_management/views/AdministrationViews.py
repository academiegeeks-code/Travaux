"""
    Panneau d'administration des utilisateurs: réservé aux administrateurs.
    Vue GET ,  logging enrichi et audit complet sur les actions de l'admin.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from user_management.Serializers.User_Serializer import UserSerializer
from user_management.permissions import HasPermissionPermission, Permission
from user_management.mixins import LoggingMixin


class AdminView(LoggingMixin, APIView):
    permission_classes = [IsAuthenticated, HasPermissionPermission]
    required_permission = Permission.MANAGE_USERS

    def get(self, request, pk, *args, **kwargs):

        if not request.user.is_staff:
            self.log_security_event("access_denied", {
                "user": request.user.email
            })
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        self.log_success("administration_views_access_successfully")
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)