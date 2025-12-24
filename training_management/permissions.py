# training_management/permissions.py
from rest_framework import permissions

class CanViewFormations(permissions.BasePermission):
    """Permission pour visualiser les formations et supports"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'intern', 'visitor']

class CanManageFormations(permissions.BasePermission):
    """Permission pour gérer les formations et supports"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class CanViewSessions(permissions.BasePermission):
    """Permission pour visualiser les sessions"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Admins et stagiaires peuvent voir, superviseurs ne peuvent pas
        return request.user.role in ['admin', 'intern', 'visitor']

class CanManageSessions(permissions.BasePermission):
    """Permission pour gérer les sessions"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Admins et formateurs éligibles peuvent gérer
        if request.user.role == 'admin':
            return True
        elif request.user.role == 'intern':
            # Vérifier si l'utilisateur est éligible comme formateur
            from django.utils import timezone
            one_month_ago = timezone.now() - timezone.timedelta(days=30)
            return request.user.date_joined <= one_month_ago
        return False

class IsFormateurOrReadOnly(permissions.BasePermission):
    """Permission pour les actions de formateur"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Pour les actions d'écriture, vérifier si c'est un formateur éligible
        if request.user.role == 'admin':
            return True
        elif request.user.role == 'intern':
            from django.utils import timezone
            one_month_ago = timezone.now() - timezone.timedelta(days=30)
            return request.user.date_joined <= one_month_ago
        return False

    def has_object_permission(self, request, view, obj):
        # Pour les actions sur un objet spécifique
        if request.method in permissions.SAFE_METHODS:
            return True
            
        if request.user.role == 'admin':
            return True
            
        # Un formateur ne peut modifier que ses propres sessions
        if hasattr(obj, 'formateur'):
            return obj.formateur == request.user
            
        return False