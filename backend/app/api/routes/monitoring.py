from fastapi import APIRouter, HTTPException
from app.celery_app import celery_app
import os
import psutil
from datetime import datetime
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/health")
async def system_health():
    """Get system health status"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_mb": round(memory.available / (1024 * 1024), 2),
                "disk_percent": disk.percent
            },
            "thresholds": {
                "cpu_critical": cpu_percent > 80,
                "memory_critical": memory.percent > 90,
                "disk_critical": disk.percent > 90
            }
        }
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/celery/workers")
async def get_celery_workers():
    """Get Celery worker status"""
    try:
        inspect = celery_app.control.inspect()
        if not inspect:
            return {"workers": [], "status": "no_workers_available"}
        
        stats = inspect.stats()
        active_tasks = inspect.active()
        
        if not stats:
            return {"workers": [], "status": "no_workers_available"}
        
        workers_info = []
        for worker_name, worker_stats in stats.items():
            workers_info.append({
                "name": worker_name,
                "pool": worker_stats.get('pool', {}).get('implementation', 'unknown'),
                "total_tasks": worker_stats.get('total', 0),
                "active_tasks": len(active_tasks.get(worker_name, []) if active_tasks else [])
            })
        
        return {"workers": workers_info, "status": "ok"}
    except Exception as e:
        return {"workers": [], "status": "error", "error": str(e)}

@router.get("/database/connection")
async def check_database_connection():
    """Check database connection"""
    try:
        from app.db.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {"status": "connected", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

@router.get("/redis/connection")
async def check_redis_connection():
    """Check Redis connection"""
    try:
        from app.cache.cache_manager import cache_manager
        if cache_manager.redis_client:
            cache_manager.redis_client.ping()
            return {"status": "connected", "timestamp": datetime.utcnow().isoformat()}
        else:
            return {"status": "not_configured"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

@router.get("/logs")
async def get_recent_logs(lines: int = 100):
    """Get recent application logs"""
    try:
        log_file = 'logs/app.log'
        if not os.path.exists(log_file):
            return {"logs": [], "message": "No logs available"}
        
        with open(log_file, 'r') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:]
        
        return {"total_lines": len(all_lines), "recent_lines": recent_lines}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
