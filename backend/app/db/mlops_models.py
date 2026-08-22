from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
from enum import Enum

class DeploymentStatus(str, Enum):
    """Deployment status"""
    PENDING = "pending"
    BUILDING = "building"
    BUILT = "built"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"
    ROLLING_BACK = "rolling_back"
    ROLLED_BACK = "rolled_back"

class DeploymentEnvironment(str, Enum):
    """Deployment environments"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class ModelRegistry(Base):
    """Model registry with versioning"""
    __tablename__ = "model_registry"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    model_type = Column(String, nullable=True)
    framework = Column(String, nullable=True)
    
    latest_version = Column(String, default="1.0.0")
    latest_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    
    is_active = Column(Boolean, default=True, index=True)
    is_production_ready = Column(Boolean, default=False)
    
    total_versions = Column(Integer, default=0)
    total_deployments = Column(Integer, default=0)
    
    tags = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelVersion(Base):
    """Model versions"""
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    registry_id = Column(Integer, ForeignKey("model_registry.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    version = Column(String, nullable=False)
    release_notes = Column(Text, nullable=True)
    
    model_uri = Column(String, nullable=True)
    model_size_mb = Column(Float, default=0.0)
    file_hash = Column(String, nullable=True)
    
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_score = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    
    input_schema = Column(JSON, nullable=True)
    output_schema = Column(JSON, nullable=True)
    training_config = Column(JSON, nullable=True)
    
    test_status = Column(String, nullable=True)
    test_results = Column(JSON, nullable=True)
    
    is_validated = Column(Boolean, default=False)
    validation_errors = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ModelDeployment(Base):
    """Model deployments"""
    __tablename__ = "model_deployments"
    
    id = Column(Integer, primary_key=True, index=True)
    registry_id = Column(Integer, ForeignKey("model_registry.id"), nullable=False)
    version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    environment = Column(SQLEnum(DeploymentEnvironment), nullable=False, default=DeploymentEnvironment.STAGING)
    status = Column(SQLEnum(DeploymentStatus), default=DeploymentStatus.PENDING)
    
    replicas = Column(Integer, default=1)
    resource_type = Column(String, default="cpu")
    memory_mb = Column(Integer, default=1024)
    cpu_cores = Column(Float, default=1.0)
    
    api_endpoint = Column(String, nullable=True)
    websocket_endpoint = Column(String, nullable=True)
    
    traffic_percentage = Column(Float, default=100.0)
    is_canary = Column(Boolean, default=False)
    
    latency_p50_ms = Column(Float, nullable=True)
    latency_p95_ms = Column(Float, nullable=True)
    latency_p99_ms = Column(Float, nullable=True)
    request_rate = Column(Float, default=0.0)
    error_rate = Column(Float, default=0.0)
    
    is_healthy = Column(Boolean, default=True)
    last_health_check = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    deployed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DeploymentMetrics(Base):
    """Deployment performance metrics"""
    __tablename__ = "deployment_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("model_deployments.id"), nullable=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    requests = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    cpu_usage_percent = Column(Float, default=0.0)
    memory_usage_mb = Column(Float, default=0.0)
    gpu_usage_percent = Column(Float, nullable=True)
    
    custom_metrics = Column(JSON, nullable=True)

class ModelTest(Base):
    """Model testing records"""
    __tablename__ = "model_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    test_type = Column(String, nullable=False)
    test_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    status = Column(String, default="passed")
    duration_seconds = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    
    test_config = Column(JSON, nullable=True)
    results = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ModelPerformanceAlert(Base):
    """Performance alerts for deployed models"""
    __tablename__ = "model_performance_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("model_deployments.id"), nullable=False)
    
    alert_type = Column(String, nullable=False)
    severity = Column(String, default="medium")
    
    metric_name = Column(String, nullable=False)
    threshold = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ABTestConfig(Base):
    """A/B testing configuration"""
    __tablename__ = "ab_test_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    control_deployment_id = Column(Integer, ForeignKey("model_deployments.id"))
    variant_deployment_id = Column(Integer, ForeignKey("model_deployments.id"))
    
    control_traffic_percent = Column(Float, default=50.0)
    variant_traffic_percent = Column(Float, default=50.0)
    
    primary_metric = Column(String, default="accuracy")
    secondary_metrics = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    control_mean = Column(Float, nullable=True)
    variant_mean = Column(Float, nullable=True)
    statistical_significance = Column(Float, nullable=True)

class ModelRollback(Base):
    """Rollback history"""
    __tablename__ = "model_rollbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("model_deployments.id"), nullable=False)
    from_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    to_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    reason = Column(Text, nullable=True)
    status = Column(String, default="in_progress")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
