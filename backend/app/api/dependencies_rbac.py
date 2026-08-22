from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.db import models
from app.middleware.tenant import get_current_tenant, validate_tenant_access
from app.services.rbac import RBACService, Permission
import logging

logger = logging.getLogger(__name__)

async def check_permission(required_permission: Permission):
    """Dependency factory checking permissions"""
    async def _check(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> models.User:
        if not current_user.organization_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not part of an organization")
        
        has_perm = RBACService.has_permission(
            db, current_user.id, current_user.organization_id, required_permission
        )
        if not has_perm:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        
        return current_user
    return _check

async def check_org_admin(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.User:
    """Check if current user is organization admin or system admin"""
    if not current_user.is_org_admin and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

async def check_tenant_access(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> int:
    """Validate header tenant access for user"""
    tenant_id = get_current_tenant()
    if not validate_tenant_access(db, current_user.id, tenant_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for tenant")
    return tenant_id
