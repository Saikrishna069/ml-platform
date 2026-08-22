from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from app.db.tenant_models import Organization
import logging
from contextvars import ContextVar

logger = logging.getLogger(__name__)

current_tenant: ContextVar[int] = ContextVar('tenant_id', default=None)

class TenantMiddleware(BaseHTTPMiddleware):
    """Extract and validate tenant from request header"""
    
    async def dispatch(self, request: Request, call_next):
        tenant_id = request.headers.get("X-Tenant-ID")
        
        if tenant_id:
            try:
                current_tenant.set(int(tenant_id))
            except ValueError:
                pass
        
        response = await call_next(request)
        return response

def get_current_tenant() -> int:
    """Get current tenant ID from context"""
    tenant_id = current_tenant.get()
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not provided in X-Tenant-ID header")
    return tenant_id

def validate_tenant_access(
    db: Session,
    user_id: int,
    tenant_id: int
) -> bool:
    """Validate user access to tenant"""
    from app.db import models
    
    try:
        user = db.query(models.User).filter(
            models.User.id == user_id
        ).first()
        
        if not user:
            return False
        
        if user.is_admin:
            return True
            
        if user.organization_id != tenant_id:
            return False
        
        return True
    
    except Exception as e:
        logger.error(f"Tenant validation failed: {str(e)}")
        return False
