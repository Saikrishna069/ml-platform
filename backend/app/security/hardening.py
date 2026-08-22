from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
import logging
import hashlib
import secrets
import re

logger = logging.getLogger(__name__)

class SecurityHeaders(BaseHTTPMiddleware):
    """Add production security headers to responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:;"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Advanced rate limiting middleware"""
    
    def __init__(self, app, requests_per_minute: int = 120):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_history = {}
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        cutoff_time = datetime.utcnow() - timedelta(minutes=1)
        
        if client_ip in self.request_history:
            self.request_history[client_ip] = [
                t for t in self.request_history[client_ip] if t > cutoff_time
            ]
        else:
            self.request_history[client_ip] = []
        
        if len(self.request_history[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            raise HTTPException(status_code=429, detail="Too many requests")
        
        self.request_history[client_ip].append(datetime.utcnow())
        return await call_next(request)

class InputSanitizer:
    """Sanitize user inputs"""
    
    DANGEROUS_PATTERNS = [
        r"<script",
        r"javascript:",
        r"onerror=",
        r"onclick=",
        r"' OR '1'='1",
        r"'; DROP TABLE",
    ]
    
    @staticmethod
    def sanitize_string(value: str) -> str:
        if not isinstance(value, str):
            return value
        
        for pattern in InputSanitizer.DANGEROUS_PATTERNS:
            value = re.sub(pattern, "", value, flags=re.IGNORECASE)
        return value
    
    @staticmethod
    def sanitize_dict(data: dict) -> dict:
        return {
            k: InputSanitizer.sanitize_string(v) if isinstance(v, str) else v
            for k, v in data.items()
        }

class EncryptionManager:
    """Handle password hashing and verification"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        salt = secrets.token_hex(32)
        pwd_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            salt.encode(),
            100000
        )
        return f"{salt}${pwd_hash.hex()}"
    
    @staticmethod
    def verify_password(password: str, hash_value: str) -> bool:
        try:
            salt, pwd_hash = hash_value.split('$')
            new_hash = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode(),
                salt.encode(),
                100000
            )
            return new_hash.hex() == pwd_hash
        except Exception:
            return False
