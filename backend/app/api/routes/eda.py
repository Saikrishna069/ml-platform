from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester, DataIngestionError
from app.ml_pipeline.eda import ExploratoryDataAnalysis, EDAError
from app.ml_pipeline.preprocessing import DataPreprocessor, PreprocessingError
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

class PreprocessingConfig(BaseModel):
    remove_duplicates: bool = True
    remove_outliers: bool = False
    outlier_method: str = "iqr"
    scaling_method: str = "standard"
    encoding_method: str = "label"
    missing_numeric_strategy: str = "mean"
    missing_categorical_strategy: str = "most_frequent"

@router.get("/{dataset_id}/analysis")
async def get_eda_analysis(
    dataset_id: int,
    db: Session = Depends(get_db)
):
    """Get comprehensive EDA for a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Load data
        df = data_ingester.load_data(dataset.file_path)
        
        # Perform EDA
        eda = ExploratoryDataAnalysis(df)
        report = eda.get_full_report()
        
        return {
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "analysis": report
        }
    
    except EDAError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing EDA: {str(e)}")

@router.post("/{dataset_id}/preprocess")
async def preprocess_dataset(
    dataset_id: int,
    config: PreprocessingConfig,
    db: Session = Depends(get_db)
):
    """Preprocess a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Load data
        df = data_ingester.load_data(dataset.file_path)
        
        # Create preprocessor
        preprocessor = DataPreprocessor(df)
        
        # Apply preprocessing steps
        preprocessor\
            .handle_missing_values(
                numeric_strategy=config.missing_numeric_strategy,
                categorical_strategy=config.missing_categorical_strategy
            )\
            .remove_duplicates()
        
        if config.remove_outliers:
            preprocessor.remove_outliers(method=config.outlier_method)
        
        preprocessor\
            .scale_numeric_features(method=config.scaling_method)\
            .encode_categorical_features(method=config.encoding_method)
        
        # Get results
        processed_df, steps = preprocessor.get_preprocessed_data()
        summary = preprocessor.get_summary()
        
        # Save preprocessed data
        preprocessed_path = dataset.file_path.replace('.csv', '_preprocessed.csv')
        processed_df.to_csv(preprocessed_path, index=False)
        
        return {
            "message": "Dataset preprocessed successfully",
            "dataset_id": dataset_id,
            "summary": summary,
            "preprocessing_steps": steps,
            "preprocessed_shape": processed_df.shape
        }
    
    except PreprocessingError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error preprocessing dataset: {str(e)}")

@router.get("/{dataset_id}/statistics")
async def get_dataset_statistics(
    dataset_id: int,
    stat_type: str = Query("all", pattern="^(all|numeric|categorical)$"),
    db: Session = Depends(get_db)
):
    """Get specific statistics for a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = data_ingester.load_data(dataset.file_path)
        eda = ExploratoryDataAnalysis(df)
        
        if stat_type == "numeric":
            return {"statistics": eda.get_numerical_statistics()}
        elif stat_type == "categorical":
            return {"statistics": eda.get_categorical_statistics()}
        else:  # all
            return {
                "numeric": eda.get_numerical_statistics(),
                "categorical": eda.get_categorical_statistics(),
                "missing": eda.get_missing_values()
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")
