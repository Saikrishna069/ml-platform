from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.cache.cache_manager import cache_manager
import json

router = APIRouter()

@router.get("/{dataset_id}/statistics")
async def get_cached_dataset_statistics(
    dataset_id: int,
    stat_type: str = Query("all", pattern="^(all|numeric|categorical)$"),
    db: Session = Depends(get_db)
):
    """Get cached dataset statistics"""
    
    cache_key = f"dataset_stats:{dataset_id}:{stat_type}"
    cached_result = cache_manager.get(cache_key)
    if cached_result is not None:
        return {**cached_result, "from_cache": True}
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        from app.ml_pipeline.data_ingestion import data_ingester
        from app.ml_pipeline.eda import ExploratoryDataAnalysis
        
        df = data_ingester.load_data(dataset.file_path)
        eda = ExploratoryDataAnalysis(df)
        
        if stat_type == "numeric":
            result = {"statistics": eda.get_numerical_statistics()}
        elif stat_type == "categorical":
            result = {"statistics": eda.get_categorical_statistics()}
        else:
            result = {
                "numeric": eda.get_numerical_statistics(),
                "categorical": eda.get_categorical_statistics(),
                "missing": eda.get_missing_values()
            }
        
        cache_manager.set(cache_key, result, ttl=3600)
        return {**result, "from_cache": False}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{dataset_id}/preview")
async def get_cached_dataset_preview(
    dataset_id: int,
    rows: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get cached dataset preview"""
    
    cache_key = f"dataset_preview:{dataset_id}:{rows}"
    cached_result = cache_manager.get(cache_key)
    if cached_result is not None:
        return {**cached_result, "from_cache": True}
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        from app.ml_pipeline.data_ingestion import data_ingester
        
        df = data_ingester.load_data(dataset.file_path)
        preview = df.head(rows).to_dict(orient='records')
        
        result = {
            "dataset_id": dataset_id,
            "total_rows": len(df),
            "preview_rows": len(preview),
            "data": preview
        }
        
        cache_manager.set(cache_key, result, ttl=1800)
        return {**result, "from_cache": False}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{dataset_id}/clear-cache")
async def clear_dataset_cache(dataset_id: int):
    """Clear all cached data for a dataset"""
    pattern = f"dataset_*:{dataset_id}:*"
    cleared_count = cache_manager.clear_pattern(pattern)
    return {
        "dataset_id": dataset_id,
        "cleared_keys": cleared_count
    }
