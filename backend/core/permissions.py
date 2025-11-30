"""
Custom permissions for the Embassy PWA
Role-Based Access Control (RBAC)
"""
from rest_framework import permissions


class IsCitizen(permissions.BasePermission):
    """Permission for citizen users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'CITIZEN'


class IsAgent(permissions.BasePermission):
    """Permission for any agent (RDV or Consulaire)"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['AGENT_RDV', 'AGENT_CONSULAIRE', 'ADMIN', 'SUPERADMIN']


class IsAgentRDV(permissions.BasePermission):
    """Permission for appointment agents"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['AGENT_RDV', 'ADMIN', 'SUPERADMIN']


class IsAgentConsulaire(permissions.BasePermission):
    """Permission for consular agents"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['AGENT_CONSULAIRE', 'ADMIN', 'SUPERADMIN']


class IsVigile(permissions.BasePermission):
    """Permission for security/vigile users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['VIGILE', 'ADMIN', 'SUPERADMIN']


class IsAdmin(permissions.BasePermission):
    """Permission for admin users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'SUPERADMIN']


class IsSuperAdmin(permissions.BasePermission):
    """Permission for super admin only"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'SUPERADMIN'


class IsOwnerOrAgent(permissions.BasePermission):
    """
    Permission to allow users to view/edit their own objects,
    or allow agents to view/edit all objects
    """
    
    def has_object_permission(self, request, view, obj):
        # Agents can access all objects
        if request.user.role in ['ADMIN', 'SUPERADMIN', 'AGENT_CONSULAIRE']:
            return True
        
        # Citizens can only access their own objects
        # Check various owner fields
        owner_fields = ['user', 'applicant', 'owner', 'recipient']
        for field in owner_fields:
            if hasattr(obj, field):
                return getattr(obj, field) == request.user
        
        return False


class ReadOnly(permissions.BasePermission):
    """Read-only permission"""
    
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class IsVerifiedUser(permissions.BasePermission):
    """Permission for verified users only"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_verified

