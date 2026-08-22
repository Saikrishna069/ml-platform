from sqlalchemy.orm import Session
from app.db.tenant_models import APIKey
from typing import Optional, List, Dict, Any
import secrets
import hashlib
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class APIKeyService:
    """Manage API keys"""
    
    @staticmethod
    def generate_key_pair() -> tuple:
        key = f"sk_{secrets.token_urlsafe(32)}"
        secret = secrets.token_urlsafe(64)
        return key, secret
    
    @staticmethod
    def hash_secret(secret: str) -> str:
        return hashlib.sha256(secret.encode()).hexdigest()
    
    @staticmethod
    def create_api_key(
        db: Session,
        organization_id: int,
        name: str,
        expires_in_days: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            key, secret = APIKeyService.generate_key_pair()
            hashed_secret = APIKeyService.hash_secret(secret)
            
            api_key = APIKey(
                organization_id=organization_id,
                name=name,
                key=key,
                secret=hashed_secret,
                is_active=True
            )
            
            if expires_in_days:
                api_key.expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
            
            db.add(api_key)
            db.commit()
            db.refresh(api_key)
            
            return {
                "id": api_key.id,
                "name": api_key.name,
                "key": key,
                "secret": secret,
                "created_at": api_key.created_at.isoformat(),
                "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None
            }
        except Exception as e:
            logger.error(f"API key creation failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def validate_api_key(
        db: Session,
        key: str,
        secret: str
    ) -> Optional[APIKey]:
        try:
            api_key = db.query(APIKey).filter(
                APIKey.key == key,
                APIKey.is_active == True
            ).first()
            
            if not api_key:
                return None
            
            if api_key.expires_at and api_key.expires_at < datetime.utcnow():
                return None
            
            hashed_secret = APIKeyService.hash_secret(secret)
            if hashed_secret != api_key.secret:
                return None
            
            api_key.last_used_at = datetime.utcnow()
            db.commit()
            return api_key
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return None
    
    @staticmethod
    def revoke_api_key(
        db: Session,
        api_key_id: int
    ) -> bool:
        try:
            api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
            if not api_key:
                return False
            
            api_key.is_active = False
            db.commit()
            return True
        except Exception as e:
            logger.error(f"API key revocation failed: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def list_api_keys(
        db: Session,
        organization_id: int
    ) -> List[Dict[str, Any]]:
        try:
            api_keys = db.query(APIKey).filter(
                APIKey.organization_id == organization_id
            ).all()
            
            return [
                {
                    "id": k.id,
                    "name": k.name,
                    "key": k.key[:10] + "...",
                    "is_active": k.is_active,
                    "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
                    "created_at": k.created_at.isoformat(),
                    "expires_at": k.expires_at.isoformat() if k.expires_at else None
                }
                for k in api_keys
            ]
        except Exception as e:
            logger.error(f"List API keys failed: {str(e)}")
            return []
