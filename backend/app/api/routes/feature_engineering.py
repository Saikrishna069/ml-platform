from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.feature_engineering import engineer_features, FeatureEngineeringError
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

router = APIRouter()

class FeatureEngineeringConfig(BaseModel):
    """Configuration for feature engineering"""
    target_column: Optional[str] = None
    task_type: str = "classification"
    strategies: List[str] = ["drop_low_variance", "statistical_features", "kbest"]

@router.post("/{dataset_id}/engineer")
async def engineer_dataset_features(
    dataset_id: int,
    config: FeatureEngineeringConfig,
    db: Session = Depends(get_db)
):
    """Perform feature engineering on a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = data_ingester.load_data(dataset.file_path)
        
        if config.target_column and config.target_column in df.columns:
            X = df.drop(columns=[config.target_column])
            y = df[config.target_column]
        else:
            X = df
            y = None
        
        X_engineered, summary = engineer_features(
            X, y,
            task_type=config.task_type,
            strategies=config.strategies
        )
        
        if y is not None and config.target_column:
            X_engineered[config.target_column] = y.values
        
        engineered_path = dataset.file_path.replace('.csv', '_engineered.csv')
        X_engineered.to_csv(engineered_path, index=False)
        
        return {
            "dataset_id": dataset_id,
            "message": "Feature engineering completed successfully",
            "summary": summary,
            "engineered_file_path": engineered_path
        }
    
    except FeatureEngineeringError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature engineering failed: {str(e)}")

@router.get("/{dataset_id}/suggestions")
async def get_feature_engineering_suggestions(
    dataset_id: int,
    db: Session = Depends(get_db)
):
    """Get feature engineering suggestions for a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = data_ingester.load_data(dataset.file_path)
        suggestions = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) > 1:
            suggestions.append({
                "strategy": "polynomial",
                "description": "Create polynomial interaction features from numeric columns",
                "benefit": "Captures non-linear feature relationships"
            })
            suggestions.append({
                "strategy": "interaction",
                "description": "Create multiplicative interaction features between numeric columns",
                "benefit": "Captures cross-feature interaction terms"
            })
        
        low_variance_count = sum(1 for col in numeric_cols if df[col].var() < 0.01)
        if low_variance_count > 0:
            suggestions.append({
                "strategy": "drop_low_variance",
                "description": f"Drop {low_variance_count} low-variance features",
                "benefit": "Improves model training speed and prevents overfitting"
            })
        
        if len(df.columns) > 15:
            suggestions.append({
                "strategy": "kbest",
                "description": "Select K best features using ANOVA / F-test statistical scoring",
                "benefit": "Reduces dimensionality while preserving predictive power"
            })
        
        suggestions.append({
            "strategy": "statistical_features",
            "description": "Create row-level statistical features (mean, std, max, min, sum, range)",
            "benefit": "Adds global statistical summary metrics per sample"
        })
        
        return {
            "dataset_id": dataset_id,
            "suggestions": suggestions,
            "recommended_strategies": ["drop_low_variance", "statistical_features", "kbest"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")
