from typing import Optional, Dict, Any
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db import models
from app.services.auth import AuthService

logger = logging.getLogger(__name__)

class SSOProvider:
    """Base SSO provider interface"""
    def validate_token(self, code: str, redirect_uri: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError
    def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

class GoogleSSO(SSOProvider):
    """Google OAuth2 SSO"""
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_url = "https://oauth2.googleapis.com/token"
        self.userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    def validate_token(self, code: str, redirect_uri: str) -> Optional[Dict[str, Any]]:
        try:
            import httpx
            with httpx.Client() as client:
                res = client.post(
                    self.token_url,
                    data={
                        "code": code,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code"
                    }
                )
                return res.json() if res.status_code == 200 else None
        except Exception as e:
            logger.error(f"Google token validation failed: {str(e)}")
            return None
    
    def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        try:
            import httpx
            with httpx.Client() as client:
                res = client.get(
                    self.userinfo_url,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "email": data.get("email"),
                        "name": data.get("name"),
                        "provider": "google",
                        "provider_id": data.get("id")
                    }
                return None
        except Exception as e:
            logger.error(f"Get Google user info failed: {str(e)}")
            return None

class MicrosoftSSO(SSOProvider):
    """Microsoft Azure AD SSO"""
    def __init__(self, client_id: str, client_secret: str, tenant_id: str = "common"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.tenant_id = tenant_id
        self.token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        self.userinfo_url = "https://graph.microsoft.com/v1.0/me"
    
    def validate_token(self, code: str, redirect_uri: str) -> Optional[Dict[str, Any]]:
        try:
            import httpx
            with httpx.Client() as client:
                res = client.post(
                    self.token_url,
                    data={
                        "code": code,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code",
                        "scope": "https://graph.microsoft.com/.default"
                    }
                )
                return res.json() if res.status_code == 200 else None
        except Exception as e:
            logger.error(f"Microsoft token validation failed: {str(e)}")
            return None
    
    def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        try:
            import httpx
            with httpx.Client() as client:
                res = client.get(
                    self.userinfo_url,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "email": data.get("userPrincipalName") or data.get("mail"),
                        "name": data.get("displayName"),
                        "provider": "microsoft",
                        "provider_id": data.get("id")
                    }
                return None
        except Exception as e:
            logger.error(f"Get Microsoft user info failed: {str(e)}")
            return None

class SSOAuthService:
    """Handle SSO authentication"""
    def __init__(self):
        self.providers = {}
    
    def register_provider(self, name: str, provider: SSOProvider):
        self.providers[name] = provider
    
    def authenticate_sso(
        self,
        db: Session,
        provider_name: str,
        code: str,
        redirect_uri: str
    ) -> Optional[Dict[str, Any]]:
        if provider_name not in self.providers:
            return None
        
        provider = self.providers[provider_name]
        token_res = provider.validate_token(code, redirect_uri)
        if not token_res or "access_token" not in token_res:
            return None
        
        user_info = provider.get_user_info(token_res["access_token"])
        if not user_info or not user_info.get("email"):
            return None
        
        user = db.query(models.User).filter(
            models.User.email == user_info["email"]
        ).first()
        
        if not user:
            username = user_info["email"].split("@")[0]
            user = models.User(
                email=user_info["email"],
                username=username,
                hashed_password=AuthService.hash_password("sso_password"),
                full_name=user_info.get("name"),
                email_verified=True,
                email_verified_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token_jwt = AuthService.create_access_token(data={"sub": user.username})
        
        return {
            "access_token": access_token_jwt,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name
            }
        }

sso_service = SSOAuthService()
