import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
import warnings

warnings.filterwarnings('ignore')

class ExplainabilityError(Exception):
    """Custom exception for explainability errors"""
    pass

class ModelExplainer:
    """Explain model predictions using various methods"""
    
    def __init__(self, model, X: pd.DataFrame, y: pd.Series = None):
        self.model = model
        self.X = X
        self.y = y
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from tree-based models"""
        try:
            if not hasattr(self.model, 'feature_importances_'):
                raise ExplainabilityError("Model doesn't support feature_importances_")
            
            feature_importances = self.model.feature_importances_
            feature_names = self.X.columns.tolist()
            
            importance_dict = dict(zip(feature_names, [float(v) for v in feature_importances]))
            sorted_importance = dict(
                sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
            )
            return sorted_importance
        
        except Exception as e:
            raise ExplainabilityError(f"Failed to get feature importance: {str(e)}")
    
    def get_coefficients(self) -> Dict[str, float]:
        """Get coefficients from linear models"""
        try:
            if not hasattr(self.model, 'coef_'):
                raise ExplainabilityError("Model doesn't have coefficients")
            
            coefficients = self.model.coef_
            if len(coefficients.shape) > 1:
                coefficients = coefficients[0]
            
            feature_names = self.X.columns.tolist()
            coef_dict = dict(zip(feature_names, [float(c) for c in coefficients]))
            
            sorted_coef = dict(
                sorted(coef_dict.items(), key=lambda x: abs(x[1]), reverse=True)
            )
            return sorted_coef
        
        except Exception as e:
            raise ExplainabilityError(f"Failed to get coefficients: {str(e)}")
    
    def get_shap_values(self, X_sample: pd.DataFrame = None, max_samples: int = 100) -> Dict[str, Any]:
        """Calculate SHAP values with safe fallback"""
        try:
            import shap
            
            if X_sample is None:
                X_sample = self.X.iloc[:min(max_samples, len(self.X))]
            
            if hasattr(self.model, 'tree_') or hasattr(self.model, 'estimators_'):
                explainer = shap.TreeExplainer(self.model)
                shap_values = explainer.shap_values(X_sample)
            else:
                explainer = shap.KernelExplainer(self.model.predict, X_sample)
                shap_values = explainer.shap_values(X_sample)
            
            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            
            feature_importance = np.abs(shap_values).mean(axis=0)
            feature_names = self.X.columns.tolist()
            
            importance_dict = dict(zip(feature_names, [float(v) for v in feature_importance]))
            sorted_importance = dict(
                sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
            )
            
            return {
                "method": "SHAP",
                "feature_importance": sorted_importance
            }
        
        except Exception:
            # Fallback to feature importance or permutation importance
            if hasattr(self.model, 'feature_importances_'):
                return {"method": "Tree Importance", "feature_importance": self.get_feature_importance()}
            elif hasattr(self.model, 'coef_'):
                return {"method": "Linear Coefficients", "feature_importance": self.get_coefficients()}
            else:
                return {"method": "Permutation Importance", "feature_importance": self.get_permutation_importance(self.X, self.y)}
    
    def get_permutation_importance(self, X_test: pd.DataFrame, y_test: pd.Series,
                                   n_repeats: int = 5) -> Dict[str, float]:
        """Calculate permutation importance"""
        try:
            from sklearn.inspection import permutation_importance
            
            result = permutation_importance(
                self.model, X_test, y_test,
                n_repeats=n_repeats,
                random_state=42,
                n_jobs=-1
            )
            
            feature_names = X_test.columns.tolist()
            importance_dict = dict(zip(feature_names, [float(m) for m in result.importances_mean]))
            
            sorted_importance = dict(
                sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
            )
            return sorted_importance
        
        except Exception as e:
            raise ExplainabilityError(f"Failed to calculate permutation importance: {str(e)}")
    
    def get_explainability_report(self, X_test: pd.DataFrame = None,
                                 y_test: pd.Series = None) -> Dict[str, Any]:
        """Generate comprehensive explainability report"""
        report = {
            "model_type": type(self.model).__name__,
            "feature_importance": None,
            "coefficients": None,
            "permutation_importance": None
        }
        
        if hasattr(self.model, 'feature_importances_'):
            try:
                report['feature_importance'] = self.get_feature_importance()
            except:
                pass
        
        if hasattr(self.model, 'coef_'):
            try:
                report['coefficients'] = self.get_coefficients()
            except:
                pass
        
        if X_test is not None and y_test is not None:
            try:
                report['permutation_importance'] = self.get_permutation_importance(X_test, y_test)
            except:
                pass
        
        return report
