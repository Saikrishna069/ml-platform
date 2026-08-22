# Production Deployment Checklist

## 1. Pre-Deployment Verification
- [ ] All unit and integration tests passing (`pytest tests/ -v`).
- [ ] Code formatting and linting validated.
- [ ] Database schema migrations up-to-date.
- [ ] Environment secrets configured in Secrets Manager.

## 2. Infrastructure Provisioning
- [ ] Terraform plan executed (`terraform plan`).
- [ ] Multi-AZ PostgreSQL database operational.
- [ ] ElastiCache Redis cluster online.
- [ ] S3 storage bucket policies and encryption enabled.
- [ ] Load balancer health checks pointing to `/health`.

## 3. Container & Image Security
- [ ] Multi-stage Docker builds compiled.
- [ ] Vulnerability scan performed on ECR container images.
- [ ] Non-root `appuser` execution context verified.

## 4. Post-Deployment Smoke Tests
- [ ] `/health/full` endpoint returns `healthy`.
- [ ] User authentication endpoint (`POST /api/auth/login`) operational.
- [ ] Async Celery task queue connection verified.
- [ ] Response latency headers (`X-Process-Time`) within <500ms p95 threshold.
