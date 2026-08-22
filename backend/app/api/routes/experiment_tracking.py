from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies import get_current_user
from app.services.experiment_tracking import experiment_tracker
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter()

class CreateExperimentRequest(BaseModel):
    dataset_id: int
    name: str
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class LogMetricsRequest(BaseModel):
    metrics: Dict[str, float]
    step: int = 1

class CompleteExperimentRequest(BaseModel):
    results: Dict[str, Any]

@router.post("/create")
async def create_experiment(
    request: CreateExperimentRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new experiment"""
    experiment = experiment_tracker.create_experiment(
        db,
        request.dataset_id,
        current_user.id,
        request.name,
        request.description,
        request.config
    )
    if not experiment:
        raise HTTPException(status_code=500, detail="Failed to create experiment")
    
    return {
        "experiment_id": experiment.id,
        "name": experiment.name,
        "status": experiment.status,
        "created_at": experiment.created_at.isoformat()
    }

@router.post("/{experiment_id}/log-metrics")
async def log_metrics(
    experiment_id: int,
    request: LogMetricsRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log metrics for experiment"""
    success = experiment_tracker.log_metrics(db, experiment_id, request.metrics, request.step)
    if not success:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {"message": "Metrics logged"}

@router.post("/{experiment_id}/complete")
async def complete_experiment(
    experiment_id: int,
    request: CompleteExperimentRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete experiment"""
    success = experiment_tracker.complete_experiment(db, experiment_id, request.results)
    if not success:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {"message": "Experiment completed"}

@router.get("/{dataset_id}/history")
async def get_experiment_history(
    dataset_id: int,
    limit: int = Query(50, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get experiment history"""
    history = experiment_tracker.get_experiment_history(db, dataset_id, limit)
    return {"history": history}

@router.post("/compare")
async def compare_experiments(
    experiment_ids: List[int],
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare multiple experiments"""
    comparison = experiment_tracker.compare_experiments(db, experiment_ids)
    if not comparison:
        raise HTTPException(status_code=404, detail="Experiments not found")
    return comparison
