from sqlalchemy.orm import Session
from app.db.mlops_models import (
    ModelRegistry, ModelVersion, ModelDeployment,
    DeploymentStatus, DeploymentEnvironment, ModelTest,
    ModelPerformanceAlert, ABTestConfig, ModelRollback, DeploymentMetrics
)
from app.db import models
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta
import hashlib
import json

logger = logging.getLogger(__name__)

class ModelRegistryService:
    """Manage model registry and versioning"""
    
    @staticmethod
    def register_model(
        db: Session,
        organization_id: int,
        creator_id: int,
        name: str,
        description: str,
        model_type: str,
        framework: str,
        tags: List[str] = None
    ) -> Optional[ModelRegistry]:
        try:
            slug = f"{name.lower().replace(' ', '-')}-{organization_id}"
            
            registry = ModelRegistry(
                organization_id=organization_id,
                creator_id=creator_id,
                name=name,
                slug=slug,
                description=description,
                model_type=model_type,
                framework=framework,
                tags=tags or []
            )
            
            db.add(registry)
            db.commit()
            db.refresh(registry)
            logger.info(f"Model registered: {name}")
            return registry
        
        except Exception as e:
            logger.error(f"Model registration failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def create_version(
        db: Session,
        registry_id: int,
        creator_id: int,
        version: str,
        model_uri: str,
        metrics: Dict[str, float],
        input_schema: Dict[str, Any],
        output_schema: Dict[str, Any],
        training_config: Dict[str, Any],
        release_notes: str = None
    ) -> Optional[ModelVersion]:
        try:
            file_hash = hashlib.sha256(f"{model_uri}{datetime.utcnow()}".encode()).hexdigest()
            
            model_version = ModelVersion(
                registry_id=registry_id,
                creator_id=creator_id,
                version=version,
                model_uri=model_uri,
                file_hash=file_hash,
                release_notes=release_notes,
                accuracy=metrics.get("accuracy"),
                precision=metrics.get("precision"),
                recall=metrics.get("recall"),
                f1_score=metrics.get("f1_score"),
                auc_score=metrics.get("auc_score"),
                rmse=metrics.get("rmse"),
                mae=metrics.get("mae"),
                r2_score=metrics.get("r2_score"),
                input_schema=input_schema,
                output_schema=output_schema,
                training_config=training_config
            )
            
            db.add(model_version)
            
            registry = db.query(ModelRegistry).filter(ModelRegistry.id == registry_id).first()
            if registry:
                registry.latest_version = version
                registry.latest_version_id = model_version.id
                registry.total_versions += 1
            
            db.commit()
            db.refresh(model_version)
            logger.info(f"Model version created: {version}")
            return model_version
        
        except Exception as e:
            logger.error(f"Version creation failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def validate_version(
        db: Session,
        version_id: int,
        test_results: Dict[str, Any]
    ) -> bool:
        try:
            version = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
            if not version:
                return False
            
            passed = test_results.get("all_passed", False)
            version.is_validated = passed
            version.test_status = "passed" if passed else "failed"
            version.test_results = test_results
            if not passed:
                version.validation_errors = test_results.get("errors", [])
            
            db.commit()
            return passed
        
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def deploy_model(
        db: Session,
        registry_id: int,
        version_id: int,
        organization_id: int,
        creator_id: int,
        environment: str,
        name: str,
        replicas: int = 1,
        memory_mb: int = 1024,
        cpu_cores: float = 1.0,
        traffic_percentage: float = 100.0
    ) -> Optional[ModelDeployment]:
        try:
            env_enum = DeploymentEnvironment.PRODUCTION if environment == "production" else (
                DeploymentEnvironment.STAGING if environment == "staging" else DeploymentEnvironment.DEVELOPMENT
            )
            
            deployment = ModelDeployment(
                registry_id=registry_id,
                version_id=version_id,
                organization_id=organization_id,
                creator_id=creator_id,
                name=name,
                environment=env_enum,
                status=DeploymentStatus.DEPLOYED,
                api_endpoint=f"http://localhost:8000/api/inference/infer",
                replicas=replicas,
                memory_mb=memory_mb,
                cpu_cores=cpu_cores,
                traffic_percentage=traffic_percentage,
                deployed_at=datetime.utcnow()
            )
            
            db.add(deployment)
            
            registry = db.query(ModelRegistry).filter(ModelRegistry.id == registry_id).first()
            if registry:
                registry.total_deployments += 1
            
            db.commit()
            db.refresh(deployment)
            logger.info(f"Deployment created: {name} to {environment}")
            return deployment
        
        except Exception as e:
            logger.error(f"Deployment creation failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def record_deployment_metrics(
        db: Session,
        deployment_id: int,
        requests: int,
        errors: int,
        latency_ms: float,
        cpu_usage: float,
        memory_usage: float,
        gpu_usage: float = None,
        custom_metrics: Dict[str, Any] = None
    ) -> bool:
        try:
            metrics = DeploymentMetrics(
                deployment_id=deployment_id,
                requests=requests,
                errors=errors,
                latency_ms=latency_ms,
                cpu_usage_percent=cpu_usage,
                memory_usage_mb=memory_usage,
                gpu_usage_percent=gpu_usage,
                custom_metrics=custom_metrics
            )
            db.add(metrics)
            
            deployment = db.query(ModelDeployment).filter(ModelDeployment.id == deployment_id).first()
            if deployment and requests > 0:
                deployment.latency_p50_ms = latency_ms
                deployment.request_rate = requests
                deployment.error_rate = (errors / requests) if requests > 0 else 0.0
            
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Metrics recording failed: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def create_ab_test(
        db: Session,
        organization_id: int,
        name: str,
        control_deployment_id: int,
        variant_deployment_id: int,
        primary_metric: str,
        control_traffic: float = 50.0,
        variant_traffic: float = 50.0
    ) -> Optional[ABTestConfig]:
        try:
            ab_test = ABTestConfig(
                organization_id=organization_id,
                name=name,
                control_deployment_id=control_deployment_id,
                variant_deployment_id=variant_deployment_id,
                primary_metric=primary_metric,
                control_traffic_percent=control_traffic,
                variant_traffic_percent=variant_traffic,
                is_active=True,
                started_at=datetime.utcnow()
            )
            
            control_dep = db.query(ModelDeployment).filter(ModelDeployment.id == control_deployment_id).first()
            variant_dep = db.query(ModelDeployment).filter(ModelDeployment.id == variant_deployment_id).first()
            
            if control_dep and variant_dep:
                control_dep.traffic_percentage = control_traffic
                variant_dep.traffic_percentage = variant_traffic
                variant_dep.is_canary = True
            
            db.add(ab_test)
            db.commit()
            db.refresh(ab_test)
            return ab_test
        
        except Exception as e:
            logger.error(f"A/B test creation failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def rollback_deployment(
        db: Session,
        deployment_id: int,
        to_version_id: int,
        creator_id: int,
        reason: str
    ) -> Optional[ModelRollback]:
        try:
            deployment = db.query(ModelDeployment).filter(ModelDeployment.id == deployment_id).first()
            if not deployment:
                return None
            
            rollback = ModelRollback(
                deployment_id=deployment_id,
                from_version_id=deployment.version_id,
                to_version_id=to_version_id,
                creator_id=creator_id,
                reason=reason,
                status="completed",
                completed_at=datetime.utcnow()
            )
            
            deployment.version_id = to_version_id
            deployment.status = DeploymentStatus.ROLLED_BACK
            
            db.add(rollback)
            db.commit()
            db.refresh(rollback)
            return rollback
        
        except Exception as e:
            logger.error(f"Rollback failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def get_model_registry(
        db: Session,
        registry_id: int
    ) -> Optional[Dict[str, Any]]:
        try:
            registry = db.query(ModelRegistry).filter(ModelRegistry.id == registry_id).first()
            if not registry:
                return None
            
            versions = db.query(ModelVersion).filter(ModelVersion.registry_id == registry_id).all()
            deployments = db.query(ModelDeployment).filter(ModelDeployment.registry_id == registry_id).all()
            
            return {
                "id": registry.id,
                "name": registry.name,
                "model_type": registry.model_type,
                "framework": registry.framework,
                "latest_version": registry.latest_version,
                "total_versions": len(versions),
                "total_deployments": len(deployments),
                "is_production_ready": registry.is_production_ready,
                "versions": [
                    {
                        "id": v.id,
                        "version": v.version,
                        "created_at": v.created_at.isoformat(),
                        "metrics": {
                            "accuracy": v.accuracy,
                            "f1_score": v.f1_score,
                            "auc": v.auc_score
                        },
                        "is_validated": v.is_validated
                    }
                    for v in versions
                ],
                "deployments": [
                    {
                        "id": d.id,
                        "name": d.name,
                        "environment": d.environment.value if hasattr(d.environment, 'value') else str(d.environment),
                        "status": d.status.value if hasattr(d.status, 'value') else str(d.status),
                        "version_id": d.version_id,
                        "api_endpoint": d.api_endpoint
                    }
                    for d in deployments
                ]
            }
        except Exception as e:
            logger.error(f"Get registry failed: {str(e)}")
            return None
