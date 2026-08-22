from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.preprocessing import DataPreprocessor
from app.ml_pipeline.model_training import ModelTrainer, TrainingError
from app.ml_pipeline.model_selector import recommend_models
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime

router = APIRouter()

class TrainingConfig(BaseModel):
    """Configuration for model training"""
    target_column: str
    task_type: str = "classification"  # or "regression"
    test_size: float = 0.2
    model_names: Optional[List[str]] = None
    remove_outliers: bool = False

class ExperimentCreate(BaseModel):
    """Create new experiment"""
    dataset_id: int
    name: str
    training_config: TrainingConfig

@router.post("/{experiment_id}/train")
async def start_training(
    experiment_id: int,
    training_config: TrainingConfig,
    db: Session = Depends(get_db)
):
    """Start training models for an experiment"""
    
    # Get experiment
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Get dataset
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == experiment.dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Update experiment status
        experiment.status = "running"
        experiment.started_at = datetime.utcnow()
        db.commit()
        
        # Load data
        df = data_ingester.load_data(dataset.file_path)
        
        # Check target column
        if training_config.target_column not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{training_config.target_column}' not found"
            )
        
        # Separate features and target
        X = df.drop(columns=[training_config.target_column])
        y = df[training_config.target_column]
        
        # Preprocess data
        preprocessor = DataPreprocessor(X)
        preprocessor\
            .handle_missing_values()\
            .remove_duplicates()\
            .scale_numeric_features()\
            .encode_categorical_features()
        X_processed, _ = preprocessor.get_preprocessed_data()
        
        # Train models
        trainer = ModelTrainer(X_processed, y, task_type=training_config.task_type)
        results = trainer.train_multiple_models(
            model_names=training_config.model_names,
            test_size=training_config.test_size
        )
        
        # Save results to database
        for result in results:
            if 'error' in result:
                continue
            
            model_run = models.ModelRun(
                experiment_id=experiment_id,
                model_name=result['model_name'],
                hyperparameters={},
                metrics=result['metrics'],
                training_time_seconds=result['training_time_seconds'],
                status='completed'
            )
            db.add(model_run)
        
        # Update experiment
        experiment.status = "completed"
        experiment.completed_at = datetime.utcnow()
        db.commit()
        
        return {
            "experiment_id": experiment_id,
            "status": "completed",
            "results": results,
            "total_models": len(results),
            "successful_models": len([r for r in results if 'error' not in r])
        }
    
    except TrainingError as e:
        experiment.status = "failed"
        experiment.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        experiment.status = "failed"
        experiment.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.get("/{experiment_id}/results")
async def get_training_results(
    experiment_id: int,
    db: Session = Depends(get_db)
):
    """Get results of a completed training experiment"""
    
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Get all model runs
    model_runs = db.query(models.ModelRun).filter(
        models.ModelRun.experiment_id == experiment_id
    ).all()
    
    # Process results
    results = []
    best_model = None
    best_score = -float('inf')
    
    for run in model_runs:
        result = {
            "model_name": run.model_name,
            "metrics": run.metrics,
            "training_time": run.training_time_seconds,
            "status": run.status
        }
        results.append(result)
        
        # Track best model
        if run.metrics and 'f1' in run.metrics:
            score = run.metrics['f1']
        elif run.metrics and 'r2' in run.metrics:
            score = run.metrics['r2']
        else:
            score = -float('inf')
        
        if score > best_score:
            best_score = score
            best_model = run.model_name
    
    return {
        "experiment_id": experiment_id,
        "status": experiment.status,
        "total_models": len(results),
        "results": results,
        "best_model": best_model,
        "best_score": best_score if best_score != -float('inf') else None
    }

@router.get("/{experiment_id}/comparison")
async def get_model_comparison(
    experiment_id: int,
    metric: str = Query("f1"),
    db: Session = Depends(get_db)
):
    """Get side-by-side model comparison"""
    
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    model_runs = db.query(models.ModelRun).filter(
        models.ModelRun.experiment_id == experiment_id
    ).all()
    
    # Build comparison table
    comparison = []
    
    for run in model_runs:
        if not run.metrics:
            continue
        
        comparison_item = {
            "model_name": run.model_name,
            "training_time_seconds": run.training_time_seconds,
        }
        
        # Add requested metric
        if metric in run.metrics:
            comparison_item[metric] = run.metrics[metric]
        
        # Add all available metrics
        for key, value in run.metrics.items():
            if key not in ['confusion_matrix']:
                comparison_item[key] = value
        
        comparison.append(comparison_item)
    
    # Sort by metric
    comparison.sort(
        key=lambda x: x.get(metric, 0),
        reverse=True
    )
    
    return {
        "experiment_id": experiment_id,
        "metric_sorted_by": metric,
        "comparison": comparison
    }
