#!/bin/bash

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${ENVIRONMENT:-production}
ECR_REGISTRY=${ECR_REGISTRY:-""}
IMAGE_TAG=${IMAGE_TAG:-latest}

echo "========================================"
echo "ML Platform Production Deployment"
echo "========================================"
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo "Image Tag: $IMAGE_TAG"
echo ""

# Step 1: Build Docker images
echo "[1/6] Building Docker images..."
cd ../backend
docker build -t ml-platform-api:$IMAGE_TAG .
cd ../frontend
docker build -t ml-platform-frontend:$IMAGE_TAG .
cd ../..

# Step 2: Push to ECR
if [ ! -z "$ECR_REGISTRY" ]; then
  echo "[2/6] Pushing images to ECR..."
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
  docker tag ml-platform-api:$IMAGE_TAG $ECR_REGISTRY/ml-platform-api:$IMAGE_TAG
  docker push $ECR_REGISTRY/ml-platform-api:$IMAGE_TAG
  docker tag ml-platform-frontend:$IMAGE_TAG $ECR_REGISTRY/ml-platform-frontend:$IMAGE_TAG
  docker push $ECR_REGISTRY/ml-platform-frontend:$IMAGE_TAG
else
  echo "[2/6] Skipping ECR push (ECR_REGISTRY not set)"
fi

# Step 3: Initialize Terraform
echo "[3/6] Initializing Terraform..."
cd infrastructure/terraform
terraform init -upgrade

# Step 4: Plan deployment
echo "[4/6] Planning Terraform changes..."
terraform plan -out=tfplan -var="aws_region=$AWS_REGION"

# Step 5: Apply infrastructure
echo "[5/6] Applying infrastructure changes..."
terraform apply tfplan

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
