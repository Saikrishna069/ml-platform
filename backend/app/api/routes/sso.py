from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.sso import sso_service, GoogleSSO, MicrosoftSSO
from app.config.settings import settings
from pydantic import BaseModel

router = APIRouter()

# Register configured SSO providers
if getattr(settings, "GOOGLE_CLIENT_ID", None):
    sso_service.register_provider("google", GoogleSSO(settings.GOOGLE_CLIENT_ID, getattr(settings, "GOOGLE_CLIENT_SECRET", "")))

if getattr(settings, "MICROSOFT_CLIENT_ID", None):
    sso_service.register_provider("microsoft", MicrosoftSSO(settings.MICROSOFT_CLIENT_ID, getattr(settings, "MICROSOFT_CLIENT_SECRET", "")))

class SSOCallbackRequest(BaseModel):
    code: str
    redirect_uri: str

@router.post("/{provider}/callback")
async def sso_callback(
    provider: str,
    request: SSOCallbackRequest,
    db: Session = Depends(get_db)
):
    """SSO authentication callback"""
    if provider not in sso_service.providers:
        raise HTTPException(status_code=400, detail=f"SSO provider '{provider}' not configured")
    
    result = sso_service.authenticate_sso(db, provider, request.code, request.redirect_uri)
    if not result:
        raise HTTPException(status_code=401, detail="SSO Authentication failed")
    
    return result

@router.get("/providers")
async def get_sso_providers():
    """Get active SSO providers"""
    providers = []
    if "google" in sso_service.providers:
        providers.append({"name": "google", "label": "Sign in with Google"})
    if "microsoft" in sso_service.providers:
        providers.append({"name": "microsoft", "label": "Sign in with Microsoft"})
    return {"providers": providers}
