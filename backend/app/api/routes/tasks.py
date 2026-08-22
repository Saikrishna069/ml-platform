from fastapi import APIRouter, HTTPException
from app.celery_app import celery_app
from celery.result import AsyncResult

router = APIRouter()

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """Get status of an async task"""
    try:
        task_result = AsyncResult(task_id, app=celery_app)
        
        return {
            "task_id": task_id,
            "status": task_result.status,
            "result": task_result.result if task_result.ready() else None,
            "info": task_result.info if task_result.status == 'PROGRESS' else None
        }
    except Exception as e:
        return {
            "task_id": task_id,
            "status": "PENDING",
            "info": str(e)
        }

@router.get("/")
async def list_tasks():
    """List all active tasks"""
    try:
        inspect = celery_app.control.inspect()
        active_tasks = inspect.active() if inspect else {}
        return {"active_tasks": active_tasks or {}}
    except Exception:
        return {"active_tasks": {}}

@router.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    """Cancel an async task"""
    try:
        celery_app.control.revoke(task_id, terminate=True)
        return {
            "task_id": task_id,
            "status": "cancelled"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel task: {str(e)}")

@router.get("/stats")
async def get_celery_stats():
    """Get Celery worker statistics"""
    try:
        inspect = celery_app.control.inspect()
        if not inspect:
            return {"active_tasks": {}, "stats": {}, "registered_tasks": {}}
        return {
            "active_tasks": inspect.active() or {},
            "stats": inspect.stats() or {},
            "registered_tasks": inspect.registered() or {}
        }
    except Exception:
        return {"active_tasks": {}, "stats": {}, "registered_tasks": {}}
