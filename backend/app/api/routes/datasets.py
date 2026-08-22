import os
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester, DataIngestionError
from pydantic import BaseModel
from typing import Optional, List
import json

router = APIRouter()

class DatasetResponse(BaseModel):
    id: int
    name: str
    n_rows: int
    n_columns: int
    size_bytes: int
    format: str
    uploaded_at: str
    
    class Config:
        from_attributes = True

class DatasetDetailResponse(BaseModel):
    id: int
    name: str
    n_rows: int
    n_columns: int
    size_bytes: int
    format: str
    uploaded_at: str
    statistics: Optional[dict] = None
    
    class Config:
        from_attributes = True

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    project_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Upload a dataset file (CSV, Excel, JSON, Parquet, HDF5)"""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file extension
    allowed_extensions = ['.csv', '.xlsx', '.xls', '.json', '.parquet', '.hdf5', '.h5']
    file_ext = '.' + file.filename.split('.')[-1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {allowed_extensions}"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Save file to disk
        file_path = data_ingester.save_uploaded_file(
            f"project_{project_id}/{file.filename}",
            content
        )
        
        # Load and validate data
        df = data_ingester.load_data(file_path)
        is_valid, message = data_ingester.validate_data(df)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Extract dataset info
        info = data_ingester.get_dataset_info(df, file_path)
        
        # Save to database
        db_dataset = models.Dataset(
            project_id=project_id,
            name=file.filename,
            file_path=file_path,
            format=file_ext[1:],  # Remove the dot
            n_rows=info["n_rows"],
            n_columns=info["n_columns"],
            size_bytes=info["size_bytes"],
            data_type="unknown"  # Will be determined later
        )
        
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
        
        return {
            "message": "File uploaded successfully",
            "dataset_id": db_dataset.id,
            "filename": file.filename,
            "info": info
        }
    
    except DataIngestionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/", response_model=List[DatasetResponse])
async def list_datasets(
    project_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """List all datasets for a project"""
    
    datasets = db.query(models.Dataset).filter(
        models.Dataset.project_id == project_id
    ).all()
    
    return datasets

@router.get("/{dataset_id}")
async def get_dataset_info(dataset_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Load data and get fresh statistics
        df = data_ingester.load_data(dataset.file_path)
        info = data_ingester.get_dataset_info(df, dataset.file_path)
        
        return {
            "id": dataset.id,
            "name": dataset.name,
            "n_rows": dataset.n_rows,
            "n_columns": dataset.n_columns,
            "size_bytes": dataset.size_bytes,
            "format": dataset.format,
            "uploaded_at": dataset.uploaded_at,
            "statistics": info
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading dataset: {str(e)}")

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Delete a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Delete file from disk
        if os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
        
        # Delete from database
        db.delete(dataset)
        db.commit()
        
        return {"message": "Dataset deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting dataset: {str(e)}")

@router.get("/{dataset_id}/preview")
async def get_dataset_preview(
    dataset_id: int,
    rows: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get preview of dataset (first N rows)"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = data_ingester.load_data(dataset.file_path)
        preview = df.head(rows).to_dict(orient='records')
        
        return {
            "dataset_id": dataset_id,
            "total_rows": len(df),
            "preview_rows": len(preview),
            "data": preview
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing dataset: {str(e)}")
