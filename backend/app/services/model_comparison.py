from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class ModelComparator:
    """Compare multiple models"""
    
    @staticmethod
    def create_comparison_matrix(
        models_results: Dict[str, Dict[str, float]]
    ) -> Dict[str, Any]:
        """Create comparison matrix from model results"""
        try:
            df = pd.DataFrame(models_results).T
            if len(df.columns) > 0:
                first_numeric = df.select_dtypes(include=[np.number]).columns[0]
                df = df.sort_values(by=first_numeric, ascending=False)
            
            return {
                "models": df.index.tolist(),
                "metrics": df.columns.tolist(),
                "data": df.to_dict(orient='index')
            }
        except Exception as e:
            logger.error(f"Comparison matrix creation failed: {str(e)}")
            return {}
    
    @staticmethod
    def score_models(
        models_results: Dict[str, Dict[str, float]],
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, float]:
        """Score models based on multiple metrics"""
        try:
            if not weights:
                weights = {"accuracy": 0.5, "f1": 0.3, "precision": 0.1, "recall": 0.1}
            
            scores = {}
            for model_name, metrics in models_results.items():
                score = 0.0
                total_weight = 0.0
                for metric, weight in weights.items():
                    if metric in metrics and isinstance(metrics[metric], (int, float)):
                        score += metrics[metric] * weight
                        total_weight += weight
                scores[model_name] = float(score / total_weight) if total_weight > 0 else 0.0
            
            return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))
        except Exception as e:
            logger.error(f"Model scoring failed: {str(e)}")
            return {}
    
    @staticmethod
    def get_best_model(
        models_results: Dict[str, Dict[str, float]],
        metric: str = "accuracy"
    ) -> Optional[Dict[str, Any]]:
        """Get best model by metric"""
        try:
            best_model = None
            best_score = -float('inf')
            
            for model_name, metrics in models_results.items():
                if metric in metrics and isinstance(metrics[metric], (int, float)):
                    if metrics[metric] > best_score:
                        best_score = float(metrics[metric])
                        best_model = model_name
            
            if best_model:
                return {
                    "best_model": best_model,
                    "metric": metric,
                    "score": best_score,
                    "metrics": models_results[best_model]
                }
            return None
        except Exception as e:
            logger.error(f"Get best model failed: {str(e)}")
            return None
