from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies import get_current_user
from app.services.experimentation import ExperimentationFramework
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class AnalyzeTestRequest(BaseModel):
    control_data: List[float]
    variant_data: List[float]
    metric_type: str = "continuous"

class SampleSizeRequest(BaseModel):
    baseline_rate: float
    min_effect_size: float = 0.05
    alpha: float = 0.05
    beta: float = 0.20

class PowerAnalysisRequest(BaseModel):
    baseline_rate: float
    effect_size: float
    sample_size: int
    alpha: float = 0.05

class SequentialAnalysisRequest(BaseModel):
    control_values: List[float]
    variant_values: List[float]
    stopping_rule: str = "pocock"

@router.post("/sample-size")
async def calculate_sample_size(
    request: SampleSizeRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Calculate required sample size for A/B test"""
    sample_size = ExperimentationFramework.calculate_sample_size(
        request.baseline_rate,
        request.min_effect_size,
        request.alpha,
        request.beta
    )
    
    return {
        "sample_size_per_group": sample_size,
        "total_samples": sample_size * 2,
        "baseline_rate": request.baseline_rate,
        "min_effect_size": request.min_effect_size
    }

@router.post("/power-analysis")
async def power_analysis(
    request: PowerAnalysisRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Analyze statistical power"""
    analysis = ExperimentationFramework.power_analysis(
        request.baseline_rate,
        request.effect_size,
        request.sample_size,
        request.alpha
    )
    
    if not analysis:
        raise HTTPException(status_code=500, detail="Power analysis failed")
    
    return analysis

@router.post("/analyze-test")
async def analyze_test(
    request: AnalyzeTestRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Analyze A/B test results"""
    results = ExperimentationFramework.analyze_test_results(
        request.control_data,
        request.variant_data,
        request.metric_type
    )
    
    if not results:
        raise HTTPException(status_code=500, detail="Analysis failed")
    
    return results

@router.post("/sequential-analysis")
async def sequential_analysis(
    request: SequentialAnalysisRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Sequential analysis for early stopping"""
    analysis = ExperimentationFramework.sequential_analysis(
        request.control_values,
        request.variant_values,
        request.stopping_rule
    )
    
    if not analysis:
        raise HTTPException(status_code=500, detail="Sequential analysis failed")
    
    return analysis
