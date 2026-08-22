from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.cache.redis_cache import redis_cache
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

class CachingMiddleware(BaseHTTPMiddleware):
    """Intelligent HTTP caching middleware"""
    
    CACHEABLE_METHODS = {"GET"}
    CACHEABLE_PATHS = {
        "/api/datasets",
        "/api/eda",
        "/api/models",
        "/api/marketplace",
    }
    
    async def dispatch(self, request: Request, call_next):
        if request.method not in self.CACHEABLE_METHODS:
            return await call_next(request)
        
        cacheable = any(request.url.path.startswith(path) for path in self.CACHEABLE_PATHS)
        if not cacheable:
            return await call_next(request)
        
        cache_key = self._generate_cache_key(request)
        
        try:
            cached_data = redis_cache.get(cache_key)
            if cached_data:
                logger.info(f"Cache hit: {cache_key}")
        except Exception as e:
            logger.warning(f"Cache lookup failed: {str(e)}")
        
        response = await call_next(request)
        return response
    
    def _generate_cache_key(self, request: Request) -> str:
        key_parts = [
            request.method,
            request.url.path,
            str(sorted(request.query_params.items()))
        ]
        key_string = "|".join(key_parts)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"http:{key_hash}"
