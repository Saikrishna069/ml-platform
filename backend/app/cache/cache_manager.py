import redis
import json
from typing import Any, Optional
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    """Manage caching with Redis"""
    
    def __init__(self):
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            logger.info("Redis connection successful")
        except Exception as e:
            logger.warning(f"Redis not available ({str(e)}), falling back to no-op cache")
            self.redis_client = None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set cache value"""
        try:
            if self.redis_client is None:
                return False
            serialized = json.dumps(value)
            self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set failed for {key}: {str(e)}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            if self.redis_client is None:
                return None
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get failed for {key}: {str(e)}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete cache value"""
        try:
            if self.redis_client is None:
                return False
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete failed for {key}: {str(e)}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all cache entries matching pattern"""
        try:
            if self.redis_client is None:
                return 0
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache clear pattern failed for {pattern}: {str(e)}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if cache key exists"""
        try:
            if self.redis_client is None:
                return False
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists check failed for {key}: {str(e)}")
            return False

# Global cache manager instance
cache_manager = CacheManager()

def cache_result(ttl: int = 3600):
    """Decorator to cache function results"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            cached = cache_manager.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached
            
            result = await func(*args, **kwargs)
            cache_manager.set(cache_key, result, ttl=ttl)
            return result
        return wrapper
    return decorator
