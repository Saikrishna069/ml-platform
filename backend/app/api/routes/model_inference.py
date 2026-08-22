from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies import get_current_user
from app.services.model_inference import ModelInferenceService
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter()

class InferenceRequest(BaseModel):
    model_id: int
    input_data: Dict[str, Any]

class BatchInferenceRequest(BaseModel):
    model_id: int
    input_data: List[Dict[str, Any]]

@router.post("/infer")
async def infer(
    request: InferenceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run inference on published model"""
    result = ModelInferenceService.run_inference(
        request.model_id, request.input_data, current_user.id, db
    )
    if result is None:
        raise HTTPException(status_code=403, detail="Access denied or model not found")
    return result

@router.post("/infer/batch")
async def batch_infer(
    request: BatchInferenceRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run batch inference"""
    results = ModelInferenceService.batch_inference(
        request.model_id, request.input_data, current_user.id, db
    )
    if results is None:
        raise HTTPException(status_code=403, detail="Access denied or model not found")
    return {
        "total_inferences": len(results),
        "results": results
    }

@router.get("/models/{model_id}/api-schema")
async def get_model_api_schema(
    model_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get model API schema"""
    from app.db.marketplace_models import PublishedModel
    
    model = db.query(PublishedModel).filter(PublishedModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    features = model.input_features or ["feature_1", "feature_2"]
    return {
        "model_id": model.id,
        "model_name": model.name,
        "input_features": features,
        "input_format": {
            "type": "object",
            "properties": {feat: {"type": "number"} for feat in features}
        },
        "output_type": model.output_type or "classification",
        "output_format": {
            "type": "object",
            "properties": {
                "prediction": {"type": "number"},
                "confidence": {"type": "number"}
            }
        }
    }
