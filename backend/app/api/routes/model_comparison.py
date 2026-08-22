from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.model_comparison import ModelComparator
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter()

class ComparisonRequest(BaseModel):
    models_results: Dict[str, Dict[str, float]]
    weights: Optional[Dict[str, float]] = None
    target_metric: Optional[str] = "accuracy"

@router.post("/compare-matrix")
async def create_comparison_matrix(request: ComparisonRequest):
    """Create comparison matrix from model results"""
    matrix = ModelComparator.create_comparison_matrix(request.models_results)
    if not matrix:
        raise HTTPException(status_code=400, detail="Failed to create comparison matrix")
    return matrix

@router.post("/score-models")
async def score_models(request: ComparisonRequest):
    """Score models based on weighted metrics"""
    scores = ModelComparator.score_models(request.models_results, request.weights)
    return {"scores": scores}

@router.post("/best-model")
async def get_best_model(request: ComparisonRequest):
    """Identify best model by metric"""
    metric = request.target_metric or "accuracy"
    best = ModelComparator.get_best_model(request.models_results, metric)
    if not best:
        raise HTTPException(status_code=404, detail=f"No models found containing metric '{metric}'")
    return best
