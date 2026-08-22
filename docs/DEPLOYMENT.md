# Production Deployment Guide

## Prerequisites

- AWS Account with Administrator permissions
- Docker & Docker Compose
- Terraform 1.0+
- AWS CLI v2
- GitHub Actions Secrets configured

## Quick Start Deployment

```bash
# Set AWS Environment
export AWS_REGION=us-east-1
export ENVIRONMENT=production

# Run automated deployment script
cd infrastructure
./deploy.sh
```

## Step-by-Step Deployment

### 1. Build Docker Containers
```bash
cd backend && docker build -t ml-platform-api:latest .
cd ../frontend && docker build -t ml-platform-frontend:latest .
```

### 2. Provision AWS Infrastructure via Terraform
```bash
cd infrastructure/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 3. Monitoring & Rollback
- View ECS Logs: `aws logs tail /ecs/ml-platform-api --follow`
- Rollback Deployment: `POST /api/mlops/deployments/{id}/rollback`
