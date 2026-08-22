from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.computer_vision import (
    ImagePreprocessor, FeatureExtractor, ImageClassifier, ImageStatistics
)
from pydantic import BaseModel
from typing import List
import os
import uuid

router = APIRouter()

@router.post("/classify")
async def classify_image(
    file: UploadFile = File(...),
    model_type: str = "resnet50",
    top_k: int = 5
):
    """Classify image"""
    try:
        temp_dir = "./uploads/temp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
        
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        
        classifier = ImageClassifier(model_type)
        predictions = classifier.classify(temp_path, top_k)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return {
            "filename": file.filename,
            "model": model_type,
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/extract-features")
async def extract_image_features(
    file: UploadFile = File(...),
    model_type: str = "resnet50"
):
    """Extract features from image"""
    try:
        temp_dir = "./uploads/temp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
        
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        
        extractor = FeatureExtractor(model_type)
        features = extractor.extract_features(temp_path)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return {
            "filename": file.filename,
            "model": model_type,
            "feature_dimension": len(features),
            "features": features.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/statistics")
async def get_image_statistics(
    file: UploadFile = File(...)
):
    """Get image statistics"""
    try:
        temp_dir = "./uploads/temp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
        
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        
        stats = ImageStatistics.get_statistics(temp_path)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return {
            "filename": file.filename,
            "statistics": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/models")
async def get_available_models():
    """Get available CV models"""
    return {
        "models": [
            {
                "name": "ResNet50",
                "type": "resnet50",
                "description": "Deep residual network for image classification",
                "features": 2048
            },
            {
                "name": "VGG16",
                "type": "vgg16",
                "description": "Visual Geometry Group network",
                "features": 512
            },
            {
                "name": "MobileNetV2",
                "type": "mobilenet",
                "description": "Efficient mobile neural network",
                "features": 1280
            }
        ]
    }
