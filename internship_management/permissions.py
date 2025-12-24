"""
Permissions personnalisées pour la gestion des thèmes.
"""
from rest_framework import permissions
from rest_framework.permissions import BasePermission

class IsAdminOrSupervisor(BasePermission):
    """
    Permission permettant uniquement aux administrateurs et superviseurs.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role in ['admin', 'supervisor']
        )

class CanAssignTheme(BasePermission):
    """
    Permission pour l'attribution des thèmes.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Seuls les admins peuvent attribuer des thèmes
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class ThemeAccessPermission(BasePermission):
    """
    Permission globale pour l'accès aux thèmes.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Les admins ont tous les droits
        if request.user.role == 'admin':
            return True
        
        # Les superviseurs peuvent voir les thèmes
        if request.user.role == 'supervisor' and request.method in permissions.SAFE_METHODS:
            return True
        
        # Les stagiaires ne peuvent voir que leur thème attribué
        if request.user.role == 'intern' and request.method in permissions.SAFE_METHODS:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        
        if request.user.role == 'supervisor' and request.method in permissions.SAFE_METHODS:
            return True
        
        # Un stagiaire ne peut voir que son propre thème
        if request.user.role == 'intern' and request.method in permissions.SAFE_METHODS:
            return obj.assigned_to == request.user
        
        return False