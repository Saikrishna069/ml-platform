# ML Platform Architecture

## System Overview

The ML Platform is a comprehensive, enterprise-grade machine learning system designed for production use. It consists of multiple integrated components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  Dashboard | Marketplace | MLOps | Creator | AutoML             │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    API Gateway (FastAPI)                        │
│  90+ Endpoints | Authentication | Rate Limiting | Monitoring    │
└────────────────────────┬────────────────────────────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│   ML Core   │   │   Services  │   │   Storage   │
│             │   │             │   │             │
│ • Training  │   │ • Registry  │   │ • S3/Models │
│ • Inference │   │ • Publish   │   │ • RDS/DB    │
│ • AutoML    │   │ • Deploy    │   │ • Redis     │
│ • Testing   │   │ • Monitor   │   │ • ElastiCache│
└─────────────┘   └─────────────┘   └─────────────┘
```

## Technology Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Language**: Python 3.11
- **Async Processing**: Celery 5.3 + Redis
- **Database**: PostgreSQL / SQLite (SQLAlchemy 2.0)
- **Cache**: Redis 7

### ML & Data Science
- **ML Libraries**: scikit-learn, XGBoost, LightGBM, TensorFlow, PyTorch
- **Feature Engineering**: pandas, numpy, scipy
- **Model Explainability**: SHAP
- **Time Series**: statsmodels, Prophet
- **NLP**: NLTK, VADER
- **Computer Vision**: ResNet50 / OpenCV / Pillow

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **HTTP**: Axios

## Database Schemas (35+ Tables)
- **Core**: `users`, `organizations`, `teams`, `api_keys`, `audit_logs`
- **Data & Training**: `datasets`, `experiments`, `metric_logs`, `model_runs`
- **AutoML & MLOps**: `model_registry`, `model_versions`, `model_deployments`, `deployment_metrics`, `model_tests`, `ab_test_configs`, `model_rollbacks`
- **Marketplace**: `published_models`, `model_reviews`, `model_usage_records`, `model_purchases`, `model_collections`

## Security & Compliance
- **Auth**: JWT tokens, OAuth2 SSO (Google, Microsoft), API key SHA-256 hashing.
- **RBAC**: SYSTEM_ADMIN, ORG_ADMIN, TEAM_ADMIN, EDITOR, VIEWER, GUEST roles.
- **Tenant Middleware**: `X-Tenant-ID` header context propagation.
