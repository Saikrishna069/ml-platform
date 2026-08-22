from sqlalchemy.orm import Session
from app.db.tenant_models import UsageMetric, Organization
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UsageTracker:
    """Track organization usage"""
    
    @staticmethod
    def get_or_create_current_metric(
        db: Session,
        organization_id: int
    ) -> UsageMetric:
        """Get or create usage metric for current month"""
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        metric = db.query(UsageMetric).filter(
            UsageMetric.organization_id == organization_id,
            UsageMetric.month == current_month
        ).first()
        
        if not metric:
            metric = UsageMetric(
                organization_id=organization_id,
                month=current_month
            )
            db.add(metric)
            db.commit()
            db.refresh(metric)
        
        return metric
    
    @staticmethod
    def increment_api_calls(db: Session, organization_id: int, count: int = 1) -> bool:
        try:
            metric = UsageTracker.get_or_create_current_metric(db, organization_id)
            metric.api_calls += count
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to increment API calls: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def increment_model_trainings(db: Session, organization_id: int, count: int = 1) -> bool:
        try:
            metric = UsageTracker.get_or_create_current_metric(db, organization_id)
            metric.model_trainings += count
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to increment model trainings: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def update_storage_usage(db: Session, organization_id: int, bytes_used: int) -> bool:
        try:
            metric = UsageTracker.get_or_create_current_metric(db, organization_id)
            metric.storage_bytes = bytes_used
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to update storage usage: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def get_usage_stats(db: Session, organization_id: int, month: Optional[str] = None) -> Optional[Dict[str, Any]]:
        try:
            if not month:
                month = datetime.utcnow().strftime("%Y-%m")
            
            metric = db.query(UsageMetric).filter(
                UsageMetric.organization_id == organization_id,
                UsageMetric.month == month
            ).first()
            
            org = db.query(Organization).filter(Organization.id == organization_id).first()
            
            max_api_calls = org.max_api_calls if org else 10000
            max_storage_bytes = (org.max_storage_gb * 1024 * 1024 * 1024) if org else (10 * 1024 * 1024 * 1024)
            
            api_calls = metric.api_calls if metric else 0
            storage_bytes = metric.storage_bytes if metric else 0
            trainings = metric.model_trainings if metric else 0
            
            return {
                "month": month,
                "api_calls": {
                    "used": api_calls,
                    "limit": max_api_calls,
                    "percentage": round((api_calls / max(max_api_calls, 1)) * 100, 2)
                },
                "storage": {
                    "used_bytes": storage_bytes,
                    "limit_bytes": max_storage_bytes,
                    "percentage": round((storage_bytes / max(max_storage_bytes, 1)) * 100, 2)
                },
                "model_trainings": {
                    "used": trainings
                },
                "plan": org.plan if org else "free"
            }
        except Exception as e:
            logger.error(f"Get usage stats failed: {str(e)}")
            return None
