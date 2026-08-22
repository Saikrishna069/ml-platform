from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies_rbac import check_org_admin
from app.services.api_key import APIKeyService
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class CreateAPIKeyRequest(BaseModel):
    name: str
    expires_in_days: Optional[int] = None

@router.post("/create")
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Create new API key"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not part of an organization")
    
    api_key = APIKeyService.create_api_key(
        db,
        current_user.organization_id,
        request.name,
        request.expires_in_days
    )
    if not api_key:
        raise HTTPException(status_code=500, detail="Failed to create API key")
    
    return api_key

@router.get("/list")
async def list_api_keys(
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """List API keys"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not part of an organization")
    
    return {"api_keys": APIKeyService.list_api_keys(db, current_user.organization_id)}

@router.post("/revoke/{api_key_id}")
async def revoke_api_key(
    api_key_id: int,
    current_user: models.User = Depends(check_org_admin),
    db: Session = Depends(get_db)
):
    """Revoke API key"""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not part of an organization")
    
    success = APIKeyService.revoke_api_key(db, api_key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"message": "API key revoked"}
