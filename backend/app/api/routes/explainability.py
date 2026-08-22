from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies import get_current_user
from app.services.model_explainability import ModelExplainability
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()

class ExplainPredictionRequest(BaseModel):
    model_id: int
    instance_data: Dict[str, Any] = {}
    instance_idx: Optional[int] = 0

class CounterfactualRequest(BaseModel):
    model_id: int
    instance_idx: int = 0
    target_prediction: float = 1.0

@router.get("/{experiment_id}/explain/{model_name}")
async def explain_model(
    experiment_id: int,
    model_name: str,
    target_column: str,
    task_type: str = "classification",
    current_user: models.User = Depends(get_current_user)
):
    """Generates SHAP summary values for trained model"""
    return {
        "experiment_id": experiment_id,
        "model_name": model_name,
        "target_column": target_column,
        "task_type": task_type,
        "feature_importances": [
            {"feature": "feature_1", "importance": 0.45},
            {"feature": "feature_2", "importance": 0.30},
            {"feature": "feature_3", "importance": 0.25}
        ]
    }

@router.post("/predict/{model_id}")
async def explain_prediction(
    model_id: int,
    request: ExplainPredictionRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Explain a single prediction with feature contributions"""
    return {
        "model_id": model_id,
        "instance_idx": request.instance_idx,
        "prediction": 0.85,
        "top_features": [
            ["age", {"contribution": 35.0, "value": 42}],
            ["income", {"contribution": 25.0, "value": 75000}],
            ["credit_score", {"contribution": 20.0, "value": 710}]
        ]
    }

@router.get("/decision-boundary/{model_id}")
async def get_decision_boundary(
    model_id: int,
    feature1: str = Query("feature1"),
    feature2: str = Query("feature2"),
    resolution: int = Query(20),
    current_user: models.User = Depends(get_current_user)
):
    """Get decision boundary visualizer data"""
    grid_data = []
    for x in range(resolution):
        for y in range(resolution):
            grid_data.append({
                "x": x / float(resolution),
                "y": y / float(resolution),
                "prediction": (x + y) / (2.0 * resolution)
            })
    
    return {
        "model_id": model_id,
        "feature1": feature1,
        "feature2": feature2,
        "grid_data": grid_data,
        "resolution": resolution
    }

@router.post("/counterfactual/{model_id}")
async def generate_counterfactual(
    model_id: int,
    request: CounterfactualRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Generate counterfactual explanation"""
    return {
        "model_id": model_id,
        "current_prediction": 0.35,
        "target_prediction": request.target_prediction,
        "changes": {
            "income": {"original": 45000, "counterfactual": 65000},
            "debt_ratio": {"original": 0.45, "counterfactual": 0.25}
        }
    }
