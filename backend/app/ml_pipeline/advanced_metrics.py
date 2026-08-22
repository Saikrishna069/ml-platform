import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score, davies_bouldin_score, calinski_harabasz_score
)
from typing import Dict, Tuple, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ClassificationMetrics:
    """Classification evaluation metrics"""
    
    @staticmethod
    def get_all_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """Get all classification metrics"""
        
        metrics = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, average='weighted', zero_division=0)),
            "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
            "classification_report": classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        }
        
        if y_pred_proba is not None and len(np.unique(y_true)) == 2:
            try:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_pred_proba))
                fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
                metrics["roc_curve"] = {
                    "fpr": fpr.tolist(),
                    "tpr": tpr.tolist()
                }
            except Exception as e:
                logger.error(f"ROC calculation failed: {str(e)}")
        
        return metrics

class RegressionMetrics:
    """Regression evaluation metrics"""
    
    @staticmethod
    def get_all_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Get all regression metrics"""
        
        mse = mean_squared_error(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)
        
        mape = np.mean(np.abs((y_true - y_pred) / np.where(y_true != 0, y_true, 1))) * 100
        
        return {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "r2": float(r2),
            "mape": float(mape)
        }

class ClusteringMetrics:
    """Clustering evaluation metrics"""
    
    @staticmethod
    def get_all_metrics(
        X: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Get all clustering metrics"""
        
        metrics = {}
        
        try:
            metrics["silhouette_score"] = float(silhouette_score(X, y_pred))
        except Exception:
            pass
        
        try:
            metrics["davies_bouldin_index"] = float(davies_bouldin_score(X, y_pred))
        except Exception:
            pass
        
        try:
            metrics["calinski_harabasz_index"] = float(calinski_harabasz_score(X, y_pred))
        except Exception:
            pass
        
        return metrics

class CrossValidationMetrics:
    """Cross-validation metrics"""
    
    @staticmethod
    def aggregate_scores(
        scores: np.ndarray
    ) -> Dict[str, float]:
        """Aggregate CV scores"""
        
        return {
            "mean": float(np.mean(scores)),
            "std": float(np.std(scores)),
            "min": float(np.min(scores)),
            "max": float(np.max(scores)),
            "median": float(np.median(scores))
        }

class MetricsComparison:
    """Compare metrics across models"""
    
    @staticmethod
    def compare_models(
        models_metrics: Dict[str, Dict[str, float]]
    ) -> Dict[str, Any]:
        """Compare metrics from different models"""
        
        comparison = {
            "model_count": len(models_metrics),
            "metrics_comparison": {}
        }
        
        all_metrics = set()
        for metrics in models_metrics.values():
            all_metrics.update(metrics.keys())
        
        for metric in all_metrics:
            metric_values = {}
            for model, metrics in models_metrics.items():
                if metric in metrics and isinstance(metrics[metric], (int, float)):
                    metric_values[model] = metrics[metric]
            
            if metric_values:
                comparison["metrics_comparison"][metric] = {
                    "values": metric_values,
                    "best_model": max(metric_values, key=metric_values.get),
                    "best_value": max(metric_values.values()),
                    "worst_model": min(metric_values, key=metric_values.get),
                    "worst_value": min(metric_values.values())
                }
        
        return comparison

class FeatureImportanceAnalyzer:
    """Analyze feature importance metrics"""
    
    @staticmethod
    def rank_features(
        feature_names: list,
        importances: np.ndarray
    ) -> list:
        """Rank features by importance score"""
        
        sorted_indices = np.argsort(importances)[::-1]
        
        return [
            {
                "feature": feature_names[i],
                "importance": float(importances[i]),
                "rank": rank + 1
            }
            for rank, i in enumerate(sorted_indices)
        ]
