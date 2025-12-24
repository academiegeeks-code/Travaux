from enum import Enum, auto
from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.contrib.auth import get_user_model

User = get_user_model()

class Permission:
    # Remplacer les auto() par des strings
    VIEW_ANNOUNCEMENTS = "view_announcements"
    VIEW_STATS = "view_stats"
    SEND_SUGGESTIONS = "send_suggestions"
    VIEW_COMPANY_LOCATION = "view_company_location"
    # Intern permissions
    SUBMIT_TASK = "submit_task"
    UPLOAD_DOCUMENT = "upload_document"
    DOWNLOAD_CORRECTION = "download_correction"
    CHAT_WITH_ADMIN = "chat_with_admin"
    CHAT_WITH_SUPERVISOR = "chat_with_supervisor"
    # Supervisor permissions
    VIEW_ASSIGNED_STUDENTS = "view_assigned_students"
    VIEW_STUDENT_PROGRESS = "view_student_progress"
    DOWNLOAD_STUDENT_DOCUMENT = "download_student_document"
    UPLOAD_CORRECTION = "upload_correction"
    CHAT_WITH_STUDENT = "chat_with_student"
    # Admin permissions
    LOGIN = "login"
    MANAGE_INTERNS = "manage_interns"
    MANAGE_USERS = "manage_users"
    MANAGE_SUPERVISORS = "manage_supervisors"
    BULK_IMPORT_USERS = "bulk_import_users"
    EXPORT_USERS = "export_users"
    ASSIGN_THEME = "assign_theme"
    CREATE_THEME = "create_theme"
    FILTER_THEMES = "filter_themes"
    EXPORT_THEMES = "export_themes"
    MANAGE_TRAININGS = "manage_trainings"
    PUBLISH_RECRUITMENT = "publish_recruitment"
    MANAGE_DOMAINS = "manage_domains"
    VIEW_DASHBOARDS = "view_dashboards"
    
    #  training_management
    VIEW_FORMATIONS = "view_formations"
    MANAGE_FORMATIONS = "manage_formations"
    VIEW_SESSIONS = "view_sessions"
    MANAGE_SESSIONS = "manage_sessions"
    ASSIGN_FORMATEUR = "assign_formateur"
    
    # project_management
    VIEW_PROJECTS = "view_projects"
    CREATE_PROJECTS = "create_projects" 
    EDIT_PROJECTS = "edit_projects"
    DELETE_PROJECTS = "delete_projects"
    MANAGE_PROJECTS = "manage_projects"
    
    VIEW_TACHES = "view_taches"
    CREATE_TACHES = "create_taches"
    EDIT_TACHES = "edit_taches"
    ASSIGN_TACHES = "assign_taches"
    
    UPLOAD_DOCUMENTS = "upload_documents"
    DOWNLOAD_DOCUMENTS = "download_documents"
    REVIEW_DOCUMENTS = "review_documents"

    # internship_management
    VIEW_THEMES = "view_themes"
    CREATE_THEMES = "create_themes"
    EDIT_THEMES = "edit_themes"
    DELETE_THEMES = "delete_themes"
    MANAGE_THEMES = "manage_themes"
    
    VIEW_ATTRIBUTIONS = "view_attributions"
    CREATE_ATTRIBUTIONS = "create_attributions"
    EDIT_ATTRIBUTIONS = "edit_attributions"
    MANAGE_ATTRIBUTIONS = "manage_attributions"
    
    VIEW_SUIVIS = "view_suivis"
    CREATE_SUIVIS = "create_suivis"
    EDIT_SUIVIS = "edit_suivis"
    
    PROPOSER_THEME = "proposer_theme"
    ACCEPTER_ATTRIBUTION = "accepter_attribution"
    EVALUER_STAGIAIRE = "evaluer_stagiaire"
    
    # Nouvelles permissions announcements
    VIEW_ANNOUNCEMENTS = "view_announcements"
    CREATE_ANNOUNCEMENTS = "create_announcements"
    EDIT_ANNOUNCEMENTS = "edit_announcements"
    DELETE_ANNOUNCEMENTS = "delete_announcements"
    MANAGE_ANNOUNCEMENTS = "manage_announcements"
    
    PUBLISH_ANNOUNCEMENTS = "publish_announcements"
    PIN_ANNOUNCEMENTS = "pin_announcements"
    
    VIEW_COMMENTS = "view_comments"
    CREATE_COMMENTS = "create_comments"
    EDIT_COMMENTS = "edit_comments"
    DELETE_COMMENTS = "delete_comments"
    MODERATE_COMMENTS = "moderate_comments"
    
# Permissions by role - METTRE À JOUR
ADMIN_PERMISSIONS = {
    Permission.LOGIN,
    Permission.MANAGE_USERS,
    Permission.BULK_IMPORT_USERS,
    Permission.EXPORT_USERS,
    Permission.ASSIGN_THEME,
    Permission.CREATE_THEME,
    Permission.FILTER_THEMES,
    Permission.EXPORT_THEMES,
    Permission.MANAGE_TRAININGS,
    Permission.PUBLISH_RECRUITMENT,
    Permission.MANAGE_DOMAINS,
    Permission.VIEW_DASHBOARDS,
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_STATS,
    Permission.VIEW_COMPANY_LOCATION,
    Permission.MANAGE_INTERNS,
    Permission.MANAGE_SUPERVISORS,
    # Permissions training
    Permission.VIEW_FORMATIONS,
    Permission.MANAGE_FORMATIONS,
    Permission.VIEW_SESSIONS,
    Permission.MANAGE_SESSIONS,
    Permission.ASSIGN_FORMATEUR,
    # Permissions project
    Permission.VIEW_THEMES,
    Permission.CREATE_THEMES,
    Permission.EDIT_THEMES,
    Permission.DELETE_THEMES,
    Permission.MANAGE_THEMES,
    Permission.VIEW_ATTRIBUTIONS,
    Permission.CREATE_ATTRIBUTIONS,
    Permission.EDIT_ATTRIBUTIONS,
    Permission.MANAGE_ATTRIBUTIONS,
    Permission.VIEW_SUIVIS,
    Permission.CREATE_SUIVIS,
    Permission.EDIT_SUIVIS,
    Permission.PROPOSER_THEME,
    Permission.ACCEPTER_ATTRIBUTION,
    Permission.EVALUER_STAGIAIRE,
    # Permissions announcements
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.CREATE_ANNOUNCEMENTS,
    Permission.EDIT_ANNOUNCEMENTS,
    Permission.DELETE_ANNOUNCEMENTS,
    Permission.MANAGE_ANNOUNCEMENTS,
    Permission.PUBLISH_ANNOUNCEMENTS,
    Permission.PIN_ANNOUNCEMENTS,
    Permission.VIEW_COMMENTS,
    Permission.CREATE_COMMENTS,
    Permission.EDIT_COMMENTS,
    Permission.DELETE_COMMENTS,
    Permission.MODERATE_COMMENTS,
}

INTERN_PERMISSIONS = {
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_STATS,
    Permission.SEND_SUGGESTIONS,
    Permission.VIEW_COMPANY_LOCATION,
    Permission.SUBMIT_TASK,
    Permission.UPLOAD_DOCUMENT,
    Permission.DOWNLOAD_CORRECTION,
    Permission.CHAT_WITH_ADMIN,
    Permission.CHAT_WITH_SUPERVISOR,
    Permission.VIEW_FORMATIONS,
    Permission.VIEW_SESSIONS,
    Permission.VIEW_THEMES,
    Permission.VIEW_ATTRIBUTIONS,
    Permission.VIEW_SUIVIS,
    Permission.ACCEPTER_ATTRIBUTION, 
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_COMMENTS,
    Permission.CREATE_COMMENTS,
    Permission.EDIT_COMMENTS,
    Permission.DELETE_COMMENTS,
    
}

SUPERVISOR_PERMISSIONS = {
    Permission.VIEW_ASSIGNED_STUDENTS,
    Permission.VIEW_STUDENT_PROGRESS,
    Permission.DOWNLOAD_STUDENT_DOCUMENT,
    Permission.UPLOAD_CORRECTION,
    Permission.CHAT_WITH_STUDENT,
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_STATS,
    Permission.VIEW_COMPANY_LOCATION,
    Permission.VIEW_FORMATIONS,
    Permission.VIEW_SESSIONS,
    Permission.MANAGE_SESSIONS,  # Peut gérer ses sessions
    Permission.VIEW_THEMES,
    Permission.CREATE_THEMES,
    Permission.EDIT_THEMES,
    Permission.VIEW_ATTRIBUTIONS,
    Permission.CREATE_ATTRIBUTIONS,
    Permission.EDIT_ATTRIBUTIONS,
    Permission.VIEW_SUIVIS,
    Permission.CREATE_SUIVIS,
    Permission.EDIT_SUIVIS,
    Permission.PROPOSER_THEME,
    Permission.EVALUER_STAGIAIRE,
    Permission.SUBMIT_TASK,
    Permission.UPLOAD_DOCUMENT,
    Permission.DOWNLOAD_CORRECTION,
    Permission.CHAT_WITH_ADMIN,
     Permission.VIEW_ANNOUNCEMENTS,
    Permission.CREATE_ANNOUNCEMENTS,
    Permission.EDIT_ANNOUNCEMENTS,
    Permission.PUBLISH_ANNOUNCEMENTS,
    Permission.VIEW_COMMENTS,
    Permission.CREATE_COMMENTS,
    Permission.EDIT_COMMENTS,
    Permission.DELETE_COMMENTS,
    
}

BASIC_USER_PERMISSIONS = {
    Permission.SEND_SUGGESTIONS,
    Permission.VIEW_COMPANY_LOCATION,
    Permission.VIEW_FORMATIONS,  # Les visiteurs peuvent voir les formations
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_COMMENTS,
}

class IsAuthenticatedUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and not request.user.is_password_expired()

from django.contrib.auth.models import Group


class IsAdministrateur(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='Administrateur').exists()

class IsEncadreur(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='Encadreur').exists()

class IsStagiaire(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='Stagiaire').exists()

class IsEncadreurOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.groups.filter(name='Encadreur').exists()


class HasRolePermission(BasePermission):
    def has_permission(self, request, view):
        required_role = getattr(view, 'required_role', None)
        required_roles = getattr(view, 'required_roles', None)

        if not request.user.is_authenticated:
            return False
        if request.user.is_password_expired():
            return False
        if required_role and request.user.role != required_role:
            return False
        if required_roles and request.user.role not in required_roles:
            return False
        return True

class HasPermissionPermission(BasePermission):
    def has_permission(self, request, view):
        required_permission = getattr(view, 'required_permission', None)
        
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_password_expired():
            return False
        
        # Utiliser votre système de permissions personnalisé
        user_permissions = request.user.get_permissions()
        
        if required_permission and required_permission not in user_permissions:
            return False
            
        return True
      
class HasPermissionOrRole(BasePermission):
    def has_permission(self, request, view):
        required_permission = getattr(view, 'required_permission', None)
        required_permissions = getattr(view, 'required_permissions', None)
        required_role = getattr(view, 'required_role', None)
        required_roles = getattr(view, 'required_roles', None)
        user_permissions = request.user.get_permissions() if request.user.is_authenticated else BASIC_USER_PERMISSIONS
        user_role = request.user.role if request.user.is_authenticated else 'visitor'

        if request.user.is_authenticated and request.user.is_password_expired():
            return False

        perm_check = True
        role_check = True

        if required_permission:
            perm_check = required_permission in user_permissions
        if required_permissions:
            perm_check = any(p in user_permissions for p in required_permissions)
        if required_role:
            role_check = user_role == required_role
        if required_roles:
            role_check = user_role in required_roles

        return perm_check or role_check
