from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.api.dependencies import get_current_user
from app.services.model_registry_service import ModelRegistryService
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class RegisterModelRequest(BaseModel):
    name: str
    description: str
    model_type: str = "classification"
    framework: str = "scikit-learn"
    tags: Optional[List[str]] = None

class CreateVersionRequest(BaseModel):
    version: str
    model_uri: str
    metrics: Dict[str, float]
    input_schema: Dict[str, Any] = {}
    output_schema: Dict[str, Any] = {}
    training_config: Dict[str, Any] = {}
    release_notes: Optional[str] = None

class DeployModelRequest(BaseModel):
    version_id: int
    environment: str = "staging"  # development, staging, production
    name: str
    replicas: int = 1
    memory_mb: int = 1024
    cpu_cores: float = 1.0
    traffic_percentage: float = 100.0

class CreateABTestRequest(BaseModel):
    name: str
    control_deployment_id: int
    variant_deployment_id: int
    primary_metric: str = "accuracy"
    control_traffic: float = 50.0
    variant_traffic: float = 50.0

class RollbackRequest(BaseModel):
    to_version_id: int
    reason: str

@router.post("/models/register")
async def register_model(
    request: RegisterModelRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register new model in registry"""
    try:
        org_id = current_user.organization_id or 1
        registry = ModelRegistryService.register_model(
            db, org_id, current_user.id, request.name, request.description,
            request.model_type, request.framework, request.tags
        )
        if not registry:
            raise HTTPException(status_code=500, detail="Failed to register model")
        
        return {
            "registry_id": registry.id,
            "name": registry.name,
            "slug": registry.slug,
            "status": "registered"
        }
    except Exception as e:
        logger.error(f"Model registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/models/{registry_id}/versions")
async def create_version(
    registry_id: int,
    request: CreateVersionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new model version"""
    try:
        version = ModelRegistryService.create_version(
            db, registry_id, current_user.id, request.version, request.model_uri,
            request.metrics, request.input_schema, request.output_schema,
            request.training_config, request.release_notes
        )
        if not version:
            raise HTTPException(status_code=500, detail="Failed to create version")
        
        return {
            "version_id": version.id,
            "version": version.version,
            "status": "created",
            "metrics": {
                "accuracy": version.accuracy,
                "f1_score": version.f1_score,
                "auc": version.auc_score
            }
        }
    except Exception as e:
        logger.error(f"Version creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/models/{registry_id}/versions/{version_id}/validate")
async def validate_version(
    registry_id: int,
    version_id: int,
    test_results: Dict[str, Any],
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate model version"""
    success = ModelRegistryService.validate_version(db, version_id, test_results)
    return {
        "version_id": version_id,
        "validation_passed": success
    }

@router.post("/models/{registry_id}/deploy")
async def deploy_model(
    registry_id: int,
    request: DeployModelRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deploy model to environment"""
    try:
        org_id = current_user.organization_id or 1
        deployment = ModelRegistryService.deploy_model(
            db, registry_id, request.version_id, org_id, current_user.id,
            request.environment, request.name, request.replicas, request.memory_mb,
            request.cpu_cores, request.traffic_percentage
        )
        if not deployment:
            raise HTTPException(status_code=500, detail="Failed to deploy model")
        
        return {
            "deployment_id": deployment.id,
            "name": deployment.name,
            "environment": deployment.environment.value if hasattr(deployment.environment, 'value') else str(deployment.environment),
            "status": deployment.status.value if hasattr(deployment.status, 'value') else str(deployment.status),
            "api_endpoint": deployment.api_endpoint
        }
    except Exception as e:
        logger.error(f"Deployment failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/models/{registry_id}")
async def get_model_registry(
    registry_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get model registry details"""
    registry_data = ModelRegistryService.get_model_registry(db, registry_id)
    if not registry_data:
        raise HTTPException(status_code=404, detail="Registry not found")
    return registry_data

@router.post("/ab-tests")
async def create_ab_test(
    request: CreateABTestRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create A/B test"""
    try:
        org_id = current_user.organization_id or 1
        ab_test = ModelRegistryService.create_ab_test(
            db, org_id, request.name, request.control_deployment_id,
            request.variant_deployment_id, request.primary_metric,
            request.control_traffic, request.variant_traffic
        )
        if not ab_test:
            raise HTTPException(status_code=500, detail="Failed to create A/B test")
        
        return {
            "test_id": ab_test.id,
            "name": ab_test.name,
            "status": "active"
        }
    except Exception as e:
        logger.error(f"A/B test creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/deployments/{deployment_id}/rollback")
async def rollback_deployment(
    deployment_id: int,
    request: RollbackRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rollback deployment"""
    rollback = ModelRegistryService.rollback_deployment(
        db, deployment_id, request.to_version_id, current_user.id, request.reason
    )
    if not rollback:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    return {
        "rollback_id": rollback.id,
        "deployment_id": deployment_id,
        "status": rollback.status
    }

@router.post("/deployments/{deployment_id}/metrics")
async def record_deployment_metrics(
    deployment_id: int,
    requests: int = 100,
    errors: int = 0,
    latency_ms: float = 45.0,
    cpu_usage: float = 25.0,
    memory_usage: float = 512.0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record deployment metrics"""
    success = ModelRegistryService.record_deployment_metrics(
        db, deployment_id, requests, errors, latency_ms, cpu_usage, memory_usage
    )
    if not success:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return {"message": "Metrics recorded"}
