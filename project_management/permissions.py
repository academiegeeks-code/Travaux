from rest_framework.permissions import BasePermission, SAFE_METHODS

class ProjectPermissions:
    """Permissions spécifiques au module project_management"""
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

# Permissions par rôle
ADMIN_PROJECT_PERMISSIONS = {
    ProjectPermissions.VIEW_PROJECTS,
    ProjectPermissions.CREATE_PROJECTS,
    ProjectPermissions.EDIT_PROJECTS,
    ProjectPermissions.DELETE_PROJECTS,
    ProjectPermissions.MANAGE_PROJECTS,
    ProjectPermissions.VIEW_TACHES,
    ProjectPermissions.CREATE_TACHES,
    ProjectPermissions.EDIT_TACHES,
    ProjectPermissions.ASSIGN_TACHES,
    ProjectPermissions.UPLOAD_DOCUMENTS,
    ProjectPermissions.DOWNLOAD_DOCUMENTS,
    ProjectPermissions.REVIEW_DOCUMENTS,
}

SUPERVISOR_PROJECT_PERMISSIONS = {
    ProjectPermissions.VIEW_PROJECTS,
    ProjectPermissions.CREATE_PROJECTS,
    ProjectPermissions.EDIT_PROJECTS,
    ProjectPermissions.VIEW_TACHES,
    ProjectPermissions.CREATE_TACHES,
    ProjectPermissions.EDIT_TACHES,
    ProjectPermissions.ASSIGN_TACHES,
    ProjectPermissions.UPLOAD_DOCUMENTS,
    ProjectPermissions.DOWNLOAD_DOCUMENTS,
    ProjectPermissions.REVIEW_DOCUMENTS,
}

INTERN_PROJECT_PERMISSIONS = {
    ProjectPermissions.VIEW_PROJECTS,
    ProjectPermissions.VIEW_TACHES,
    ProjectPermissions.UPLOAD_DOCUMENTS,
    ProjectPermissions.DOWNLOAD_DOCUMENTS,
}

class CanViewProjects(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.VIEW_PROJECTS in user_perms

class CanCreateProjects(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.CREATE_PROJECTS in user_perms

class CanEditProjects(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.EDIT_PROJECTS in user_perms

class CanManageProjects(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.MANAGE_PROJECTS in user_perms

class CanViewTaches(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.VIEW_TACHES in user_perms

class CanCreateTaches(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.CREATE_TACHES in user_perms

class CanAssignTaches(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.ASSIGN_TACHES in user_perms

class CanUploadDocuments(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.UPLOAD_DOCUMENTS in user_perms

class CanReviewDocuments(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = request.user.get_permissions()
        return ProjectPermissions.REVIEW_DOCUMENTS in user_perms

class IsProjectOwnerOrReadOnly(BasePermission):
    """L'encadreur peut modifier son projet, lecture pour les autres"""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.encadreur == request.user or request.user.role == 'admin'

class IsTaskAssigneeOrSupervisor(BasePermission):
    """Le stagiaire assigné ou le superviseur peuvent modifier la tâche"""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (obj.assignee == request.user or 
                obj.projet.encadreur == request.user or
                request.user.role == 'admin')