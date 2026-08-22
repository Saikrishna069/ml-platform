from sqlalchemy.orm import Session
from app.db.tenant_models import AuditLog
from typing import Optional, Dict, Any
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AuditService:
    """Track audit logs"""
    
    @staticmethod
    def log_action(
        db: Session,
        organization_id: int,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        changes: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """Log an action"""
        try:
            audit_log = AuditLog(
                organization_id=organization_id,
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                changes=json.dumps(changes) if changes else None,
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.add(audit_log)
            db.commit()
            logger.info(f"Audit: {action} by user {user_id} on {resource_type}:{resource_id}")
            return True
        except Exception as e:
            logger.error(f"Audit logging failed: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def get_audit_logs(
        db: Session,
        organization_id: int,
        limit: int = 100,
        offset: int = 0,
        action_filter: Optional[str] = None,
        resource_type_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get audit logs"""
        try:
            query = db.query(AuditLog).filter(
                AuditLog.organization_id == organization_id
            )
            
            if action_filter:
                query = query.filter(AuditLog.action == action_filter)
            if resource_type_filter:
                query = query.filter(AuditLog.resource_type == resource_type_filter)
            
            total = query.count()
            logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
            
            return {
                "total": total,
                "limit": limit,
                "offset": offset,
                "logs": [
                    {
                        "id": log.id,
                        "user_id": log.user_id,
                        "action": log.action,
                        "resource_type": log.resource_type,
                        "resource_id": log.resource_id,
                        "changes": json.loads(log.changes) if log.changes else None,
                        "ip_address": log.ip_address,
                        "created_at": log.created_at.isoformat()
                    }
                    for log in logs
                ]
            }
        except Exception as e:
            logger.error(f"Get audit logs failed: {str(e)}")
            return {"total": 0, "logs": []}

def get_client_ip(request) -> str:
    """Extract client IP from request"""
    if request.headers.get('x-forwarded-for'):
        return request.headers['x-forwarded-for'].split(',')[0].strip()
    return request.client.host if request.client else "unknown"
