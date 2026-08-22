from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.preprocessing import DataPreprocessor
from app.ml_pipeline.deep_learning import train_deep_learning_model, DeepLearningError
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DeepLearningConfig(BaseModel):
    target_column: str
    task_type: str = "classification"
    model_type: str = "mlp"
    epochs: int = 30
    batch_size: int = 32

@router.post("/{experiment_id}/train")
async def train_deep_learning(
    experiment_id: int,
    config: DeepLearningConfig,
    db: Session = Depends(get_db)
):
    """Train a deep learning / neural network model"""
    
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
        
        result = train_deep_learning_model(
            X_processed.values, y.values,
            model_type=config.model_type,
            task_type=config.task_type,
            epochs=config.epochs
        )
        
        return {
            "experiment_id": experiment_id,
            "status": "completed",
            "model_type": config.model_type,
            "result": result
        }
    
    except DeepLearningError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deep learning training failed: {str(e)}")
