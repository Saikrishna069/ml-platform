import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
import warnings

warnings.filterwarnings('ignore')

class FeatureEngineeringError(Exception):
    """Custom exception for feature engineering errors"""
    pass

class FeatureEngineer:
    """Perform feature engineering tasks"""
    
    def __init__(self, X: pd.DataFrame, y: pd.Series = None, task_type: str = 'classification'):
        self.X = X.copy()
        self.original_X = X.copy()
        self.y = y
        self.task_type = task_type
        self.engineering_steps = []
        self.feature_importance = {}
    
    def create_polynomial_features(self, degree: int = 2, include_bias: bool = False) -> "FeatureEngineer":
        """Create polynomial features"""
        try:
            poly = PolynomialFeatures(degree=degree, include_bias=include_bias)
            numeric_cols = self.X.select_dtypes(include=[np.number]).columns.tolist()
            
            if not numeric_cols:
                return self
            
            # Limit polynomial degree for high dimension
            if len(numeric_cols) > 15:
                numeric_cols = numeric_cols[:15]

            X_poly = poly.fit_transform(self.X[numeric_cols])
            poly_feature_names = poly.get_feature_names_out(numeric_cols)
            
            categorical_cols = self.X.select_dtypes(exclude=[np.number]).columns.tolist()
            
            X_combined = pd.DataFrame(X_poly, columns=poly_feature_names, index=self.X.index)
            for col in categorical_cols:
                X_combined[col] = self.X[col].values
            
            self.X = X_combined
            
            self.engineering_steps.append({
                "step": "create_polynomial_features",
                "degree": degree,
                "original_features": len(numeric_cols),
                "new_features": len(poly_feature_names),
                "total_features": len(self.X.columns)
            })
            
            return self
        
        except Exception as e:
            raise FeatureEngineeringError(f"Failed to create polynomial features: {str(e)}")
    
    def select_features_kbest(self, k: int = 10) -> "FeatureEngineer":
        """Select K best features using statistical tests"""
        try:
            if self.y is None:
                raise FeatureEngineeringError("Target variable (y) required for feature selection")
            
            numeric_cols = self.X.select_dtypes(include=[np.number]).columns.tolist()
            
            if len(numeric_cols) == 0:
                return self
            
            if self.task_type == 'classification':
                score_func = f_classif
            else:
                score_func = f_regression
            
            k_actual = min(k, len(numeric_cols))
            selector = SelectKBest(score_func=score_func, k=k_actual)
            
            X_selected = selector.fit_transform(self.X[numeric_cols], self.y)
            selected_features = [numeric_cols[i] for i in selector.get_support(indices=True)]
            
            scores = selector.scores_
            for feature, score in zip(numeric_cols, scores):
                if not np.isnan(score):
                    self.feature_importance[feature] = float(score)
            
            X_new = pd.DataFrame(X_selected, columns=selected_features, index=self.X.index)
            
            categorical_cols = self.X.select_dtypes(exclude=[np.number]).columns.tolist()
            for col in categorical_cols:
                if col in self.X.columns:
                    X_new[col] = self.X[col].values
            
            self.X = X_new
            
            self.engineering_steps.append({
                "step": "select_features_kbest",
                "k": k_actual,
                "selected_features": selected_features,
                "total_features": len(self.X.columns)
            })
            
            return self
        
        except Exception as e:
            raise FeatureEngineeringError(f"Failed to select features: {str(e)}")
    
    def create_interaction_features(self, numeric_only: bool = True) -> "FeatureEngineer":
        """Create interaction features"""
        try:
            if numeric_only:
                cols = self.X.select_dtypes(include=[np.number]).columns.tolist()
            else:
                cols = self.X.columns.tolist()
            
            interaction_count = 0
            
            # Limit interaction pairs if columns count is large
            for i in range(min(len(cols), 10)):
                for j in range(i + 1, min(len(cols), 10)):
                    col1, col2 = cols[i], cols[j]
                    interaction_name = f"{col1}_x_{col2}"
                    self.X[interaction_name] = self.X[col1] * self.X[col2]
                    interaction_count += 1
            
            self.engineering_steps.append({
                "step": "create_interaction_features",
                "interactions_created": interaction_count,
                "total_features": len(self.X.columns)
            })
            
            return self
        
        except Exception as e:
            raise FeatureEngineeringError(f"Failed to create interaction features: {str(e)}")
    
    def create_statistical_features(self) -> "FeatureEngineer":
        """Create statistical features from numeric columns"""
        try:
            numeric_cols = self.X.select_dtypes(include=[np.number]).columns.tolist()
            
            if not numeric_cols:
                return self
            
            self.X['mean'] = self.X[numeric_cols].mean(axis=1)
            self.X['std'] = self.X[numeric_cols].std(axis=1).fillna(0)
            self.X['max'] = self.X[numeric_cols].max(axis=1)
            self.X['min'] = self.X[numeric_cols].min(axis=1)
            self.X['sum'] = self.X[numeric_cols].sum(axis=1)
            self.X['range'] = self.X['max'] - self.X['min']
            
            self.engineering_steps.append({
                "step": "create_statistical_features",
                "features_created": 6,
                "total_features": len(self.X.columns)
            })
            
            return self
        
        except Exception as e:
            raise FeatureEngineeringError(f"Failed to create statistical features: {str(e)}")
    
    def drop_low_variance_features(self, threshold: float = 0.01) -> "FeatureEngineer":
        """Drop features with low variance"""
        try:
            numeric_cols = self.X.select_dtypes(include=[np.number]).columns.tolist()
            
            low_variance_features = []
            
            for col in numeric_cols:
                variance = self.X[col].var()
                if pd.isna(variance) or variance < threshold:
                    low_variance_features.append(col)
            
            if low_variance_features:
                self.X = self.X.drop(columns=low_variance_features)
            
            self.engineering_steps.append({
                "step": "drop_low_variance_features",
                "threshold": threshold,
                "dropped_features": low_variance_features,
                "total_features": len(self.X.columns)
            })
            
            return self
        
        except Exception as e:
            raise FeatureEngineeringError(f"Failed to drop low variance features: {str(e)}")
    
    def get_engineered_data(self) -> Tuple[pd.DataFrame, List[Dict]]:
        """Get engineered data and steps"""
        return self.X, self.engineering_steps
    
    def get_summary(self) -> Dict[str, Any]:
        """Get feature engineering summary"""
        return {
            "original_features": len(self.original_X.columns),
            "final_features": len(self.X.columns),
            "features_added": len(self.X.columns) - len(self.original_X.columns),
            "original_shape": list(self.original_X.shape),
            "final_shape": list(self.X.shape),
            "engineering_steps": self.engineering_steps,
            "feature_importance": self.feature_importance
        }

def engineer_features(X: pd.DataFrame, y: pd.Series = None,
                     task_type: str = 'classification',
                     strategies: List[str] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Convenience function to perform feature engineering"""
    if strategies is None:
        strategies = ['drop_low_variance', 'statistical_features', 'kbest']
    
    engineer = FeatureEngineer(X, y, task_type=task_type)
    
    for strategy in strategies:
        if strategy == 'polynomial':
            engineer.create_polynomial_features(degree=2)
        elif strategy == 'interaction':
            engineer.create_interaction_features()
        elif strategy == 'statistical_features':
            engineer.create_statistical_features()
        elif strategy == 'drop_low_variance':
            engineer.drop_low_variance_features()
        elif strategy == 'kbest' and y is not None:
            engineer.select_features_kbest(k=10)
    
    X_engineered, steps = engineer.get_engineered_data()
    summary = engineer.get_summary()
    
    return X_engineered, summary
