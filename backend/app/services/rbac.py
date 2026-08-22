from enum import Enum
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.db import models
from app.db.tenant_models import TeamMember, Organization
import logging

logger = logging.getLogger(__name__)

class Role(str, Enum):
    """Available roles"""
    SYSTEM_ADMIN = "system_admin"
    ORG_ADMIN = "org_admin"
    TEAM_ADMIN = "team_admin"
    EDITOR = "editor"
    VIEWER = "viewer"
    GUEST = "guest"

class Permission(str, Enum):
    """Available permissions"""
    DATASET_CREATE = "dataset:create"
    DATASET_READ = "dataset:read"
    DATASET_UPDATE = "dataset:update"
    DATASET_DELETE = "dataset:delete"
    
    EXPERIMENT_CREATE = "experiment:create"
    EXPERIMENT_READ = "experiment:read"
    EXPERIMENT_UPDATE = "experiment:update"
    EXPERIMENT_DELETE = "experiment:delete"
    
    MODEL_CREATE = "model:create"
    MODEL_READ = "model:read"
    MODEL_DEPLOY = "model:deploy"
    
    ORG_MANAGE_USERS = "org:manage_users"
    ORG_MANAGE_TEAMS = "org:manage_teams"
    ORG_VIEW_AUDIT = "org:view_audit"
    ORG_MANAGE_BILLING = "org:manage_billing"
    
    ADMIN_ACCESS = "admin:access"

ROLE_PERMISSIONS = {
    Role.SYSTEM_ADMIN: [
        Permission.ADMIN_ACCESS, Permission.ORG_MANAGE_USERS, Permission.ORG_MANAGE_TEAMS,
        Permission.ORG_VIEW_AUDIT, Permission.ORG_MANAGE_BILLING, Permission.DATASET_CREATE,
        Permission.DATASET_READ, Permission.DATASET_UPDATE, Permission.DATASET_DELETE,
        Permission.EXPERIMENT_CREATE, Permission.EXPERIMENT_READ, Permission.EXPERIMENT_UPDATE,
        Permission.EXPERIMENT_DELETE, Permission.MODEL_CREATE, Permission.MODEL_READ, Permission.MODEL_DEPLOY
    ],
    Role.ORG_ADMIN: [
        Permission.ORG_MANAGE_USERS, Permission.ORG_MANAGE_TEAMS, Permission.ORG_VIEW_AUDIT,
        Permission.ORG_MANAGE_BILLING, Permission.DATASET_CREATE, Permission.DATASET_READ,
        Permission.DATASET_UPDATE, Permission.DATASET_DELETE, Permission.EXPERIMENT_CREATE,
        Permission.EXPERIMENT_READ, Permission.EXPERIMENT_UPDATE, Permission.EXPERIMENT_DELETE,
        Permission.MODEL_CREATE, Permission.MODEL_READ, Permission.MODEL_DEPLOY
    ],
    Role.TEAM_ADMIN: [
        Permission.DATASET_CREATE, Permission.DATASET_READ, Permission.DATASET_UPDATE, Permission.DATASET_DELETE,
        Permission.EXPERIMENT_CREATE, Permission.EXPERIMENT_READ, Permission.EXPERIMENT_UPDATE, Permission.EXPERIMENT_DELETE,
        Permission.MODEL_CREATE, Permission.MODEL_READ, Permission.MODEL_DEPLOY
    ],
    Role.EDITOR: [
        Permission.DATASET_CREATE, Permission.DATASET_READ, Permission.DATASET_UPDATE,
        Permission.EXPERIMENT_CREATE, Permission.EXPERIMENT_READ, Permission.EXPERIMENT_UPDATE,
        Permission.MODEL_CREATE, Permission.MODEL_READ
    ],
    Role.VIEWER: [
        Permission.DATASET_READ, Permission.EXPERIMENT_READ, Permission.MODEL_READ
    ],
    Role.GUEST: [
        Permission.DATASET_READ
    ]
}

class RBACService:
    """Manage role-based access control"""
    
    @staticmethod
    def get_user_role(
        db: Session,
        user_id: int,
        organization_id: int
    ) -> Optional[Role]:
        """Get user's role in organization"""
        try:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if not user:
                return None
            
            if user.is_admin:
                return Role.SYSTEM_ADMIN
            
            if user.is_org_admin and user.organization_id == organization_id:
                return Role.ORG_ADMIN
            
            team_member = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
            if team_member:
                if team_member.role in ("owner", "admin"):
                    return Role.TEAM_ADMIN
                elif team_member.role == "member":
                    return Role.EDITOR
                elif team_member.role == "viewer":
                    return Role.VIEWER
            
            return Role.GUEST
        except Exception as e:
            logger.error(f"Get user role failed: {str(e)}")
            return None
    
    @staticmethod
    def get_user_permissions(
        db: Session,
        user_id: int,
        organization_id: int
    ) -> List[Permission]:
        """Get all permissions for user"""
        role = RBACService.get_user_role(db, user_id, organization_id)
        if not role:
            return []
        return ROLE_PERMISSIONS.get(role, [])
    
    @staticmethod
    def has_permission(
        db: Session,
        user_id: int,
        organization_id: int,
        permission: Permission
    ) -> bool:
        """Check if user has specific permission"""
        permissions = RBACService.get_user_permissions(db, user_id, organization_id)
        return permission in permissions
