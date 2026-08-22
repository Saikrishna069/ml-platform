from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.preprocessing import DataPreprocessor
from app.ml_pipeline.model_training import ModelTrainer
from app.ml_pipeline.hyperparameter_tuning import HyperparameterTuner, HyperparameterTuningError
from pydantic import BaseModel
from typing import Optional, List
import numpy as np

router = APIRouter()

class TuningConfig(BaseModel):
    """Configuration for hyperparameter tuning"""
    model_name: str
    tuning_method: str = "random"  # grid, random, bayesian
    target_column: str
    task_type: str = "classification"
    cv_folds: int = 5

@router.post("/{experiment_id}/tune/{model_name}")
async def tune_model_hyperparameters(
    experiment_id: int,
    model_name: str,
    config: TuningConfig,
    db: Session = Depends(get_db)
):
    """Tune hyperparameters for a specific model"""
    
    experiment = db.query(models.Experiment).filter(
        models.Experiment.id == experiment_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == experiment.dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = data_ingester.load_data(dataset.file_path)
        
        if config.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{config.target_column}' not found")
        
        X = df.drop(columns=[config.target_column])
        y = df[config.target_column]
        
        preprocessor = DataPreprocessor(X)
        preprocessor\
            .handle_missing_values()\
            .remove_duplicates()\
            .scale_numeric_features()\
            .encode_categorical_features()
        X_processed, _ = preprocessor.get_preprocessed_data()
        
        trainer = ModelTrainer(X_processed, y, task_type=config.task_type)
        
        if config.task_type == 'classification':
            if model_name not in trainer.CLASSIFICATION_MODELS:
                raise HTTPException(status_code=400, detail=f"Model {model_name} not found")
            base_model = trainer.CLASSIFICATION_MODELS[model_name]
        else:
            if model_name not in trainer.REGRESSION_MODELS:
                raise HTTPException(status_code=400, detail=f"Model {model_name} not found")
            base_model = trainer.REGRESSION_MODELS[model_name]
        
        X_train, X_test, y_train, y_test = trainer.split_data()
        
        tuner = HyperparameterTuner(
            base_model, X_train, y_train,
            task_type=config.task_type,
            cv_folds=config.cv_folds
        )
        
        if config.tuning_method == 'grid':
            best_model, best_params, tuning_time = tuner.grid_search_tune(model_name)
        elif config.tuning_method == 'bayesian':
            best_model, best_params, tuning_time = tuner.bayesian_tune(model_name, n_calls=10)
        else:
            best_model, best_params, tuning_time = tuner.random_search_tune(model_name, n_iter=15)
        
        y_pred = best_model.predict(X_test)
        
        if config.task_type == 'classification':
            from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
            metrics = {
                'accuracy': float(accuracy_score(y_test, y_pred)),
                'f1': float(f1_score(y_test, y_pred, average='weighted', zero_division=0)),
                'precision': float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
                'recall': float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
            }
        else:
            from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
            metrics = {
                'mse': float(mean_squared_error(y_test, y_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                'mae': float(mean_absolute_error(y_test, y_pred)),
                'r2': float(r2_score(y_test, y_pred))
            }
        
        return {
            "model_name": model_name,
            "tuning_method": config.tuning_method,
            "best_params": best_params,
            "best_score": float(tuner.best_score) if tuner.best_score else None,
            "tuning_time_seconds": float(tuning_time),
            "metrics": metrics
        }
    
    except HyperparameterTuningError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tuning failed: {str(e)}")
