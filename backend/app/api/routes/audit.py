from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies import get_current_user
from app.api.dependencies_rbac import check_org_admin
from app.services.audit import AuditService, get_client_ip
import csv
import io
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.get("/logs")
async def get_audit_logs(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Get audit logs for organization"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="User not part of an organization")
    
    return AuditService.get_audit_logs(
        db,
        current_user.organization_id,
        limit=limit,
        offset=offset,
        action_filter=action,
        resource_type_filter=resource_type
    )

@router.get("/logs/user/{user_id}")
async def get_user_audit_logs(
    user_id: int,
    limit: int = Query(100, ge=1, le=1000),
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Get audit logs for specific user"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="User not part of an organization")
    
    result = AuditService.get_audit_logs(
        db,
        current_user.organization_id,
        limit=limit
    )
    result["logs"] = [log for log in result.get("logs", []) if log.get("user_id") == user_id]
    return result

@router.get("/logs/export")
async def export_audit_logs(
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Export audit logs as CSV"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="User not part of an organization")
    
    result = AuditService.get_audit_logs(
        db,
        current_user.organization_id,
        limit=5000
    )
    
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "user_id", "action", "resource_type", "resource_id", "created_at"]
    )
    writer.writeheader()
    
    for log in result.get("logs", []):
        writer.writerow({
            "id": log["id"],
            "user_id": log["user_id"],
            "action": log["action"],
            "resource_type": log["resource_type"],
            "resource_id": log["resource_id"],
            "created_at": log["created_at"]
        })
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"}
    )
