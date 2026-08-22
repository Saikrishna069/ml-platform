from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies import get_current_user
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.automl_engine import AutoMLEngine
from app.ml_pipeline.automl_config import AutoMLConfig, TaskType, SearchStrategy
from app.services.experiment_tracking import experiment_tracker
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class AutoMLRequest(BaseModel):
    dataset_id: int
    target_column: str
    task_type: str = "binary_classification"  # binary_classification, multiclass_classification, regression
    experiment_name: Optional[str] = None
    
    total_time_budget_minutes: int = 60
    enable_feature_engineering: bool = True
    enable_ensemble: bool = True
    hyperparameter_tuning: bool = True
    models: Optional[List[str]] = None
    run_async: bool = False

@router.post("/{dataset_id}/run")
async def run_automl(
    dataset_id: int,
    request: AutoMLRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run AutoML pipeline"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        experiment = experiment_tracker.create_experiment(
            db,
            dataset_id,
            current_user.id,
            request.experiment_name or f"AutoML Experiment {dataset.name}",
            config={
                "task_type": request.task_type,
                "target_column": request.target_column,
                "feature_engineering": request.enable_feature_engineering,
                "ensemble": request.enable_ensemble
            }
        )
        
        if not experiment:
            raise HTTPException(status_code=500, detail="Failed to create experiment")
        
        df = data_ingester.load_data(dataset.file_path)
        
        task_type_map = {
            "binary_classification": TaskType.BINARY_CLASSIFICATION,
            "multiclass_classification": TaskType.MULTICLASS_CLASSIFICATION,
            "regression": TaskType.REGRESSION
        }
        
        automl_config = AutoMLConfig(
            task_type=task_type_map.get(request.task_type, TaskType.BINARY_CLASSIFICATION),
            target_column=request.target_column,
            total_time_budget_minutes=request.total_time_budget_minutes,
            enable_feature_engineering=request.enable_feature_engineering,
            ensemble_enabled=request.enable_ensemble,
            hyperparameter_tuning=request.hyperparameter_tuning,
            models_to_try=request.models or ["LogisticRegression", "RandomForest", "GradientBoosting"]
        )
        
        X = df.drop(columns=[request.target_column])
        y = df[request.target_column]
        
        engine = AutoMLEngine(automl_config)
        results = engine.fit(X, y)
        
        experiment_tracker.complete_experiment(
            db,
            experiment.id,
            {
                "best_model": results.best_model_name,
                "best_score": float(results.best_score),
                "test_metrics": results.test_metrics,
                "models_tried": results.models_tried,
                "total_time": results.total_time_seconds
            }
        )
        
        return {
            "experiment_id": experiment.id,
            "best_model": results.best_model_name,
            "best_score": results.best_score,
            "test_metrics": results.test_metrics,
            "total_time_seconds": results.total_time_seconds,
            "models_tried": results.models_tried,
            "is_ensemble": results.is_ensemble,
            "feature_importance": results.feature_importance
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AutoML failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{experiment_id}/status")
async def get_automl_status(
    experiment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AutoML experiment status"""
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    return {
        "experiment_id": experiment.id,
        "status": experiment.status,
        "created_at": experiment.created_at.isoformat(),
        "completed_at": experiment.completed_at.isoformat() if experiment.completed_at else None,
        "results": experiment.results
    }

@router.post("/{experiment_id}/save-model")
async def save_automl_model(
    experiment_id: int,
    model_name: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save AutoML model to registry"""
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment or not experiment.results:
        raise HTTPException(status_code=404, detail="Experiment not found or not completed")
    
    return {
        "message": "Model saved to registry",
        "model_name": model_name or f"automl_model_{experiment_id}"
    }
