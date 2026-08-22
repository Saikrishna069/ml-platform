import asyncio
from typing import Dict, List, Optional
import logging
from datetime import datetime
from app.db.database import SessionLocal
from app.cache.cache_manager import cache_manager
from app.celery_app import celery_app
import psutil

logger = logging.getLogger(__name__)

class HealthCheck:
    """Health check service"""
    
    @staticmethod
    async def check_database() -> Dict[str, any]:
        """Check database connection"""
        try:
            db = SessionLocal()
            db.execute("SELECT 1")
            db.close()
            
            return {
                "status": "healthy",
                "service": "database",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "service": "database",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    @staticmethod
    async def check_cache() -> Dict[str, any]:
        """Check Redis cache"""
        try:
            if cache_manager.redis_client:
                cache_manager.redis_client.ping()
                return {
                    "status": "healthy",
                    "service": "cache",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            return {
                "status": "not_configured",
                "service": "cache",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Cache health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "service": "cache",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    @staticmethod
    async def check_celery() -> Dict[str, any]:
        """Check Celery workers"""
        try:
            inspect = celery_app.control.inspect()
            stats = inspect.stats() if inspect else None
            
            if stats:
                worker_count = len(stats)
                return {
                    "status": "healthy",
                    "service": "celery",
                    "workers": worker_count,
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            return {
                "status": "not_configured",
                "service": "celery",
                "message": "No active workers detected",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Celery health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "service": "celery",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    @staticmethod
    async def check_system() -> Dict[str, any]:
        """Check system resources"""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            status = "healthy"
            if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
                status = "warning"
            
            return {
                "status": status,
                "service": "system",
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            logger.error(f"System health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "service": "system",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    @staticmethod
    async def run_all_checks() -> Dict[str, any]:
        """Run all health checks"""
        checks = await asyncio.gather(
            HealthCheck.check_database(),
            HealthCheck.check_cache(),
            HealthCheck.check_celery(),
            HealthCheck.check_system()
        )
        
        overall_status = "healthy"
        for check in checks:
            if check.get("status") == "unhealthy":
                overall_status = "unhealthy"
                break
            elif check.get("status") == "warning":
                overall_status = "warning"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": checks
        }
