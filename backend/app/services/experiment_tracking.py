from sqlalchemy.orm import Session
from app.db import models
from typing import Dict, Any, List, Optional
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ExperimentTracker:
    """Track and manage ML experiments"""
    
    @staticmethod
    def create_experiment(
        db: Session,
        dataset_id: int,
        user_id: int,
        name: str,
        description: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Optional[models.Experiment]:
        try:
            experiment = models.Experiment(
                dataset_id=dataset_id,
                owner_id=user_id,
                name=name,
                description=description,
                status="created",
                config=json.dumps(config) if config else None,
                created_at=datetime.utcnow()
            )
            db.add(experiment)
            db.commit()
            db.refresh(experiment)
            return experiment
        except Exception as e:
            logger.error(f"Experiment creation failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def log_metrics(
        db: Session,
        experiment_id: int,
        metrics: Dict[str, float],
        step: int = 1
    ) -> bool:
        try:
            experiment = db.query(models.Experiment).filter(models.Experiment.id == experiment_id).first()
            if not experiment:
                return False
            
            metric_log = models.MetricLog(
                experiment_id=experiment_id,
                metrics=json.dumps(metrics),
                step=step,
                timestamp=datetime.utcnow()
            )
            db.add(metric_log)
            experiment.best_metrics = json.dumps(metrics)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Metric logging failed: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def complete_experiment(
        db: Session,
        experiment_id: int,
        results: Dict[str, Any]
    ) -> bool:
        try:
            experiment = db.query(models.Experiment).filter(models.Experiment.id == experiment_id).first()
            if not experiment:
                return False
            
            experiment.status = "completed"
            experiment.results = json.dumps(results)
            experiment.completed_at = datetime.utcnow()
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Experiment completion failed: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def compare_experiments(
        db: Session,
        experiment_ids: List[int]
    ) -> Dict[str, Any]:
        try:
            experiments = db.query(models.Experiment).filter(
                models.Experiment.id.in_(experiment_ids)
            ).all()
            
            comparison = {"total_experiments": len(experiments), "experiments": []}
            best_score = -1.0
            best_id = None
            
            for exp in experiments:
                exp_data = {
                    "id": exp.id,
                    "name": exp.name,
                    "status": exp.status,
                    "created_at": exp.created_at.isoformat()
                }
                if exp.results:
                    res = json.loads(exp.results)
                    exp_data["results"] = res
                    score = float(res.get("best_score", -1.0))
                    if score > best_score:
                        best_score = score
                        best_id = exp.id
                if exp.best_metrics:
                    exp_data["metrics"] = json.loads(exp.best_metrics)
                
                comparison["experiments"].append(exp_data)
            
            comparison["best_experiment_id"] = best_id
            comparison["best_score"] = best_score
            return comparison
        except Exception as e:
            logger.error(f"Experiment comparison failed: {str(e)}")
            return {}

    @staticmethod
    def get_experiment_history(
        db: Session,
        dataset_id: int,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        try:
            experiments = db.query(models.Experiment).filter(
                models.Experiment.dataset_id == dataset_id
            ).order_by(models.Experiment.created_at.desc()).limit(limit).all()
            
            history = []
            for exp in experiments:
                exp_data = {
                    "id": exp.id,
                    "name": exp.name,
                    "status": exp.status,
                    "created_at": exp.created_at.isoformat(),
                    "completed_at": exp.completed_at.isoformat() if exp.completed_at else None
                }
                if exp.best_metrics:
                    exp_data["metrics"] = json.loads(exp.best_metrics)
                history.append(exp_data)
            return history
        except Exception as e:
            logger.error(f"Get history failed: {str(e)}")
            return []

experiment_tracker = ExperimentTracker()
