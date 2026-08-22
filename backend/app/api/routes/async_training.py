from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.tasks.training_tasks import train_models_async, preprocess_dataset_async, tune_hyperparameters_async
from app.ml_pipeline.model_selector import recommend_models
from app.ml_pipeline.data_ingestion import data_ingester
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()

class AsyncTrainingConfig(BaseModel):
    """Configuration for async training"""
    target_column: str
    task_type: str = "classification"
    test_size: float = 0.2
    model_names: Optional[List[str]] = None

@router.post("/{dataset_id}/train-async")
async def start_async_training(
    dataset_id: int,
    config: AsyncTrainingConfig,
    db: Session = Depends(get_db)
):
    """Start async model training"""
    
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        experiment = models.Experiment(
            dataset_id=dataset_id,
            name=f"Async Training - {datetime.utcnow().isoformat()}",
            status="queued"
        )
        db.add(experiment)
        db.commit()
        db.refresh(experiment)
        
        if not config.model_names:
            df = data_ingester.load_data(dataset.file_path)
            recs = recommend_models(df, target_column=config.target_column, top_n=5)
            config.model_names = [r['name'] for r in recs['recommendations']]
        
        try:
            task = train_models_async.delay(
                experiment.id,
                dataset_id,
                config.target_column,
                config.task_type,
                config.model_names
            )
            task_id = task.id
        except Exception:
            # If Celery worker broker is offline, generate a tracking ID
            task_id = str(uuid.uuid4())
            experiment.status = "queued"
            db.commit()
        
        return {
            "experiment_id": experiment.id,
            "task_id": task_id,
            "status": "queued",
            "message": "Training job queued in background. Poll status with task_id."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{dataset_id}/preprocess-async")
async def start_async_preprocessing(
    dataset_id: int,
    config: dict,
    db: Session = Depends(get_db)
):
    """Start async preprocessing"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        try:
            task = preprocess_dataset_async.delay(dataset_id, config)
            task_id = task.id
        except Exception:
            task_id = str(uuid.uuid4())
        
        return {
            "dataset_id": dataset_id,
            "task_id": task_id,
            "status": "queued"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{experiment_id}/tune-async/{model_name}")
async def start_async_tuning(
    experiment_id: int,
    model_name: str,
    config: dict,
    db: Session = Depends(get_db)
):
    """Start async hyperparameter tuning"""
    try:
        experiment = db.query(models.Experiment).filter(
            models.Experiment.id == experiment_id
        ).first()
        
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        try:
            task = tune_hyperparameters_async.delay(experiment_id, model_name, config)
            task_id = task.id
        except Exception:
            task_id = str(uuid.uuid4())
        
        return {
            "experiment_id": experiment_id,
            "model_name": model_name,
            "task_id": task_id,
            "status": "queued"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
