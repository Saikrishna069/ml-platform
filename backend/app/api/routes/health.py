from fastapi import APIRouter
from app.healthchecks import HealthCheck

router = APIRouter()

@router.get("/full")
async def full_health_check():
    """Run full health check suite"""
    return await HealthCheck.run_all_checks()

@router.get("/db")
async def database_health():
    """Check database health"""
    return await HealthCheck.check_database()

@router.get("/cache")
async def cache_health():
    """Check cache health"""
    return await HealthCheck.check_cache()

@router.get("/celery")
async def celery_health():
    """Check Celery health"""
    return await HealthCheck.check_celery()

@router.get("/system")
async def system_health():
    """Check system health"""
    return await HealthCheck.check_system()
