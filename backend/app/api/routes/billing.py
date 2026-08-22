from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.db.tenant_models import Organization
from app.api.dependencies_rbac import check_org_admin
from app.services.usage_tracking import UsageTracker
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class UpgradePlanRequest(BaseModel):
    plan: str  # free, starter, professional, enterprise

@router.get("/usage")
async def get_usage(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Get current usage and limits"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not part of an organization")
    
    stats = UsageTracker.get_usage_stats(db, current_user.organization_id, month)
    if not stats:
        raise HTTPException(status_code=404, detail="Usage statistics not found")
    
    return stats

@router.get("/plan")
async def get_plan(
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Get organization subscription plan"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not part of an organization")
    
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return {
        "organization_id": org.id,
        "name": org.name,
        "plan": org.plan,
        "subscription_status": org.subscription_status,
        "limits": {
            "max_users": org.max_users,
            "max_storage_gb": org.max_storage_gb,
            "max_api_calls": org.max_api_calls
        }
    }

@router.post("/upgrade")
async def upgrade_plan(
    request: UpgradePlanRequest,
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Upgrade subscription plan"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not part of an organization")
    
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    valid_plans = {
        "free": {"max_users": 5, "max_storage_gb": 10, "max_api_calls": 10000},
        "starter": {"max_users": 15, "max_storage_gb": 50, "max_api_calls": 50000},
        "professional": {"max_users": 50, "max_storage_gb": 200, "max_api_calls": 250000},
        "enterprise": {"max_users": 500, "max_storage_gb": 1000, "max_api_calls": 2000000}
    }
    
    if request.plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Choose from {list(valid_plans.keys())}")
    
    limits = valid_plans[request.plan]
    org.plan = request.plan
    org.max_users = limits["max_users"]
    org.max_storage_gb = limits["max_storage_gb"]
    org.max_api_calls = limits["max_api_calls"]
    
    db.commit()
    
    return {
        "message": f"Successfully updated plan to {request.plan}",
        "plan": org.plan,
        "limits": limits
    }
