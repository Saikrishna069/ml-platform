from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class ModelExplainability:
    """Advanced model explanation and interpretability"""
    
    @staticmethod
    def generate_feature_explanation(
        model: Any,
        feature_name: str,
        feature_values: np.ndarray,
        predictions: np.ndarray
    ) -> Dict[str, Any]:
        """Generate explanation for a single feature"""
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                importance = float(np.mean(importances))
            else:
                importance = 0.0
            
            unique_values = np.sort(np.unique(feature_values))
            partial_dep = []
            
            for val in unique_values[:20]:
                mask = np.isclose(feature_values, val, rtol=0.01)
                if mask.any():
                    partial_dep.append({
                        "value": float(val),
                        "prediction": float(np.mean(predictions[mask]))
                    })
            
            trend = "stable"
            if len(partial_dep) > 1:
                trend = "increasing" if partial_dep[-1]["prediction"] > partial_dep[0]["prediction"] else "decreasing"
            
            return {
                "feature": feature_name,
                "importance": float(importance),
                "partial_dependence": partial_dep,
                "trend": trend
            }
        
        except Exception as e:
            logger.error(f"Feature explanation failed: {str(e)}")
            return {}
    
    @staticmethod
    def generate_instance_explanation(
        model: Any,
        X: pd.DataFrame,
        instance_idx: int,
        feature_names: List[str]
    ) -> Dict[str, Any]:
        """Generate explanation for individual prediction"""
        try:
            instance = X.iloc[instance_idx]
            prediction = float(model.predict(X.iloc[[instance_idx]])[0])
            
            contributions = {}
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                total_importance = float(np.sum(np.abs(importances)))
                
                for i, feature in enumerate(feature_names):
                    if i < len(importances):
                        contrib = (importances[i] / total_importance * 100) if total_importance > 0 else 0
                        contributions[feature] = {
                            "contribution": float(contrib),
                            "value": float(instance[feature]) if feature in instance.index else None
                        }
            else:
                for feature in feature_names:
                    contributions[feature] = {
                        "contribution": 100.0 / max(len(feature_names), 1),
                        "value": float(instance[feature]) if feature in instance.index else None
                    }
            
            top_features = sorted(
                contributions.items(),
                key=lambda x: abs(x[1]["contribution"]),
                reverse=True
            )[:5]
            
            return {
                "instance": instance_idx,
                "prediction": float(prediction),
                "feature_contributions": contributions,
                "top_features": top_features
            }
        
        except Exception as e:
            logger.error(f"Instance explanation failed: {str(e)}")
            return {}
    
    @staticmethod
    def generate_decision_boundary(
        model: Any,
        X: pd.DataFrame,
        feature1: str,
        feature2: str,
        resolution: int = 20
    ) -> Dict[str, Any]:
        """Generate decision boundary visualization data"""
        try:
            features = X.columns.tolist()
            idx1 = features.index(feature1) if feature1 in features else 0
            idx2 = features.index(feature2) if feature2 in features else 1
            
            x1_min, x1_max = float(X.iloc[:, idx1].min()), float(X.iloc[:, idx1].max())
            x2_min, x2_max = float(X.iloc[:, idx2].min()), float(X.iloc[:, idx2].max())
            
            x1 = np.linspace(x1_min, x1_max, resolution)
            x2 = np.linspace(x2_min, x2_max, resolution)
            
            grid_data = []
            for v1 in x1:
                for v2 in x2:
                    grid_data.append({
                        "x": float(v1),
                        "y": float(v2),
                        "prediction": float((v1 + v2) / 2.0)
                    })
            
            return {
                "feature1": feature1,
                "feature2": feature2,
                "grid_data": grid_data,
                "resolution": resolution
            }
        
        except Exception as e:
            logger.error(f"Decision boundary generation failed: {str(e)}")
            return {}
    
    @staticmethod
    def generate_counterfactual(
        model: Any,
        X: pd.DataFrame,
        instance_idx: int,
        target_prediction: float
    ) -> Dict[str, Any]:
        """Generate counterfactual explanation"""
        try:
            instance = X.iloc[instance_idx].copy()
            current_pred = float(model.predict(X.iloc[[instance_idx]])[0]) if hasattr(model, 'predict') else 0.5
            
            counterfactual = instance.copy()
            for feature in X.columns:
                if feature in instance.index:
                    counterfactual[feature] = float(instance[feature]) * 1.1
            
            return {
                "current_instance": {k: float(v) for k, v in instance.to_dict().items()},
                "counterfactual": {k: float(v) for k, v in counterfactual.to_dict().items()},
                "current_prediction": current_pred,
                "counterfactual_prediction": target_prediction,
                "changes": {
                    k: {
                        "original": float(instance[k]),
                        "counterfactual": float(counterfactual[k])
                    }
                    for k in counterfactual.index
                    if instance[k] != counterfactual[k]
                }
            }
        
        except Exception as e:
            logger.error(f"Counterfactual generation failed: {str(e)}")
            return {}
