from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    datasets, experiments, models, eda, training,
    hyperparameter_tuning, feature_engineering, deep_learning,
    explainability, reports, tasks, cached_datasets, async_training, monitoring,
    auth, health, time_series, nlp, computer_vision,
    audit, sso, api_keys, billing,
    automl, experiment_tracking, model_comparison,
    marketplace, model_inference, mlops, analytics
)
from app.middleware.monitoring import PerformanceMonitoringMiddleware
from app.middleware.tenant import TenantMiddleware
from app.security.hardening import SecurityHeaders
from app.logging_config import setup_logging
from app.config.settings import settings
from app.db.database import engine, Base
import app.db.tenant_models  # Ensure tenant tables metadata registered
import app.db.marketplace_models  # Ensure marketplace tables metadata registered
import app.db.mlops_models  # Ensure MLOps tables metadata registered

# Setup logging
setup_logging()

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="ML Dataset Analyzer",
    description="Enterprise Multi-Tenant AutoML, Marketplace, MLOps & Analytics Platform",
    version="1.2.0"
)

# Add middleware
app.add_middleware(SecurityHeaders)
app.add_middleware(TenantMiddleware)
app.add_middleware(PerformanceMonitoringMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(experiments.router, prefix="/api/experiments", tags=["experiments"])
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(eda.router, prefix="/api/eda", tags=["eda"])
app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(hyperparameter_tuning.router, prefix="/api/hyperparameter", tags=["hyperparameter"])
app.include_router(feature_engineering.router, prefix="/api/feature-engineering", tags=["feature-engineering"])
app.include_router(deep_learning.router, prefix="/api/deep-learning", tags=["deep-learning"])
app.include_router(explainability.router, prefix="/api/explainability", tags=["explainability"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(cached_datasets.router, prefix="/api/cached", tags=["cached"])
app.include_router(async_training.router, prefix="/api/async-training", tags=["async_training"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])
app.include_router(time_series.router, prefix="/api/time-series", tags=["time_series"])
app.include_router(nlp.router, prefix="/api/nlp", tags=["nlp"])
app.include_router(computer_vision.router, prefix="/api/cv", tags=["cv"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(sso.router, prefix="/api/sso", tags=["sso"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["api_keys"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(automl.router, prefix="/api/automl", tags=["automl"])
app.include_router(experiment_tracking.router, prefix="/api/experiments-tracking", tags=["experiments_tracking"])
app.include_router(model_comparison.router, prefix="/api/model-comparison", tags=["model_comparison"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["marketplace"])
app.include_router(model_inference.router, prefix="/api/inference", tags=["inference"])
app.include_router(mlops.router, prefix="/api/mlops", tags=["mlops"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

@app.get("/")
async def root():
    return {
        "name": "ML Dataset Analyzer",
        "version": "0.1.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
