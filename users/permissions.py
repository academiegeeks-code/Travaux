from enum import Enum, auto
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()

class Permission(Enum):
    # Visitor permissions
    VIEW_ANNOUNCEMENTS = auto()
    VIEW_STATS = auto()
    SEND_SUGGESTIONS = auto()
    VIEW_COMPANY_LOCATION = auto()
    # Intern permissions
    SUBMIT_TASK = auto()
    UPLOAD_DOCUMENT = auto()
    DOWNLOAD_CORRECTION = auto()
    CHAT_WITH_ADMIN = auto()
    CHAT_WITH_SUPERVISOR = auto()
    # Supervisor permissions
    VIEW_ASSIGNED_STUDENTS = auto()
    VIEW_STUDENT_PROGRESS = auto()
    DOWNLOAD_STUDENT_DOCUMENT = auto()
    UPLOAD_CORRECTION = auto()
    CHAT_WITH_STUDENT = auto()
    # Admin permissions
    LOGIN = auto()
    MANAGE_INTERNS = auto()
    MANAGE_USERS = auto()
    MANAGE_SUPERVISORS = auto()
    BULK_IMPORT_USERS = auto()
    EXPORT_USERS = auto()
    ASSIGN_THEME = auto()
    CREATE_THEME = auto()
    FILTER_THEMES = auto()
    EXPORT_THEMES = auto()
    MANAGE_TRAININGS = auto()
    PUBLISH_RECRUITMENT = auto()
    MANAGE_DOMAINS = auto()
    VIEW_DASHBOARDS = auto()

# Permissions by role
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
    Permission.MANAGE_SUPERVISORS
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
}

BASIC_USER_PERMISSIONS = {
    Permission.VIEW_ANNOUNCEMENTS,
    Permission.VIEW_STATS,
    Permission.SEND_SUGGESTIONS,
    Permission.VIEW_COMPANY_LOCATION,
}

class IsAuthenticatedUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and not request.user.is_password_expired()

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
        required_permissions = getattr(view, 'required_permissions', None)
        user_permissions = request.user.get_permissions() if request.user.is_authenticated else BASIC_USER_PERMISSIONS

        if not request.user.is_authenticated:
            # Allow visitor permissions for unauthenticated users
            return (required_permission in BASIC_USER_PERMISSIONS) or (required_permissions and all(p in BASIC_USER_PERMISSIONS for p in required_permissions))
        if request.user.is_password_expired():
            return False
        if required_permission and required_permission not in user_permissions:
            return False
        if required_permissions and not all(p in user_permissions for p in required_permissions):
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
