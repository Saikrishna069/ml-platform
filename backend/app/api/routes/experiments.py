from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class ExperimentCreate(BaseModel):
    dataset_id: int
    name: str
    description: Optional[str] = None
    config: Optional[dict] = None

@router.post("/", status_code=201)
async def create_experiment(
    experiment_data: ExperimentCreate,
    db: Session = Depends(get_db)
):
    """Create a new experiment"""
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == experiment_data.dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    experiment = models.Experiment(
        dataset_id=experiment_data.dataset_id,
        name=experiment_data.name,
        description=experiment_data.description,
        config=experiment_data.config,
        status="created"
    )
    
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    
    return experiment

@router.get("/")
async def list_experiments(
    dataset_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """List experiments, optionally filtered by dataset_id"""
    query = db.query(models.Experiment)
    if dataset_id is not None:
        query = query.filter(models.Experiment.dataset_id == dataset_id)
    return query.all()

@router.get("/{experiment_id}")
async def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db)
):
    """Get experiment details by ID"""
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    return experiment

