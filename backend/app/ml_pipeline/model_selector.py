import pandas as pd
import numpy as np
from typing import List, Dict, Any
from enum import Enum

class TaskType(Enum):
    """Supported ML task types"""
    BINARY_CLASSIFICATION = "binary_classification"
    MULTICLASS_CLASSIFICATION = "multiclass_classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"

class ModelRecommender:
    """Intelligently recommend models based on dataset characteristics"""
    
    # Model configurations for different scenarios
    MODEL_CONFIGS = {
        TaskType.BINARY_CLASSIFICATION: {
            "small_data": [  # < 1000 samples
                {
                    "name": "LogisticRegression",
                    "score": 0.90,
                    "reason": "Fast, interpretable, good for small datasets"
                },
                {
                    "name": "SVM",
                    "score": 0.85,
                    "reason": "Effective with limited data, good regularization"
                },
                {
                    "name": "RandomForest",
                    "score": 0.88,
                    "reason": "Robust, handles non-linear relationships"
                },
                {
                    "name": "KNN",
                    "score": 0.82,
                    "reason": "Simple baseline, works well with small datasets"
                },
            ],
            "medium_data": [  # 1000 - 100000 samples
                {
                    "name": "XGBoost",
                    "score": 0.93,
                    "reason": "State-of-the-art gradient boosting, excellent performance"
                },
                {
                    "name": "LightGBM",
                    "score": 0.92,
                    "reason": "Fast, memory-efficient, handles large datasets well"
                },
                {
                    "name": "RandomForest",
                    "score": 0.90,
                    "reason": "Robust ensemble method, good feature importance"
                },
                {
                    "name": "GradientBoosting",
                    "score": 0.89,
                    "reason": "Classic ensemble method, proven performance"
                },
                {
                    "name": "LogisticRegression",
                    "score": 0.80,
                    "reason": "Simple baseline, good for comparison"
                },
            ],
            "large_data": [  # > 100000 samples
                {
                    "name": "LightGBM",
                    "score": 0.94,
                    "reason": "Optimized for large datasets, fast training"
                },
                {
                    "name": "CatBoost",
                    "score": 0.93,
                    "reason": "Excellent with categorical features, robust"
                },
                {
                    "name": "XGBoost",
                    "score": 0.92,
                    "reason": "Proven performance, handles scale well"
                },
                {
                    "name": "LogisticRegression",
                    "score": 0.85,
                    "reason": "Linear baseline, very fast training"
                },
            ]
        },
        TaskType.MULTICLASS_CLASSIFICATION: {
            "small_data": [
                {
                    "name": "LogisticRegression",
                    "score": 0.88,
                    "reason": "Simple, interpretable, good baseline"
                },
                {
                    "name": "RandomForest",
                    "score": 0.86,
                    "reason": "Handles multiple classes well, robust"
                },
                {
                    "name": "SVM",
                    "score": 0.84,
                    "reason": "One-vs-rest approach, effective with small data"
                },
                {
                    "name": "KNN",
                    "score": 0.80,
                    "reason": "Simple, works for multi-class problems"
                },
            ],
            "medium_data": [
                {
                    "name": "XGBoost",
                    "score": 0.92,
                    "reason": "Excellent for multi-class, handles imbalance"
                },
                {
                    "name": "LightGBM",
                    "score": 0.91,
                    "reason": "Fast, efficient, good multi-class support"
                },
                {
                    "name": "RandomForest",
                    "score": 0.88,
                    "reason": "Robust, handles multiple classes well"
                },
                {
                    "name": "GradientBoosting",
                    "score": 0.87,
                    "reason": "Proven ensemble method"
                },
            ],
            "large_data": [
                {
                    "name": "LightGBM",
                    "score": 0.93,
                    "reason": "Optimized for large multi-class problems"
                },
                {
                    "name": "CatBoost",
                    "score": 0.92,
                    "reason": "Excellent multi-class handling"
                },
                {
                    "name": "XGBoost",
                    "score": 0.91,
                    "reason": "Scalable gradient boosting"
                },
            ]
        },
        TaskType.REGRESSION: {
            "small_data": [
                {
                    "name": "LinearRegression",
                    "score": 0.85,
                    "reason": "Simple baseline, fast training"
                },
                {
                    "name": "Ridge",
                    "score": 0.87,
                    "reason": "Handles multicollinearity well"
                },
                {
                    "name": "RandomForest",
                    "score": 0.88,
                    "reason": "Non-linear, robust regression"
                },
                {
                    "name": "SVR",
                    "score": 0.82,
                    "reason": "Support Vector Regression, good for small data"
                },
            ],
            "medium_data": [
                {
                    "name": "XGBoost",
                    "score": 0.92,
                    "reason": "State-of-the-art for regression, excellent predictions"
                },
                {
                    "name": "LightGBM",
                    "score": 0.91,
                    "reason": "Fast gradient boosting, strong performance"
                },
                {
                    "name": "RandomForest",
                    "score": 0.89,
                    "reason": "Robust, handles non-linearity"
                },
                {
                    "name": "GradientBoosting",
                    "score": 0.88,
                    "reason": "Classic ensemble method"
                },
            ],
            "large_data": [
                {
                    "name": "LightGBM",
                    "score": 0.93,
                    "reason": "Optimized for large regression problems"
                },
                {
                    "name": "XGBoost",
                    "score": 0.91,
                    "reason": "Scalable, handles large datasets efficiently"
                },
                {
                    "name": "Ridge",
                    "score": 0.85,
                    "reason": "Linear regression with regularization, very fast"
                },
            ]
        }
    }
    
    def __init__(self, df: pd.DataFrame, target_column: str = None):
        self.df = df
        self.target_column = target_column
        self.task_type = None
        self.data_size = len(df)
        self.n_features = len(df.columns) - (1 if target_column and target_column in df.columns else 0)
    
    def detect_task_type(self) -> TaskType:
        """Detect if this is classification or regression"""
        if self.target_column and self.target_column in self.df.columns:
            target = self.df[self.target_column]
            
            # Check if target is numeric
            if pd.api.types.is_numeric_dtype(target):
                # If mostly integers and small range, likely classification
                unique_vals = target.nunique()
                
                if unique_vals == 2:
                    self.task_type = TaskType.BINARY_CLASSIFICATION
                elif unique_vals < 20:  # Assume classification if < 20 classes
                    self.task_type = TaskType.MULTICLASS_CLASSIFICATION
                else:
                    self.task_type = TaskType.REGRESSION
            else:
                # Categorical target = classification
                unique_vals = target.nunique()
                if unique_vals == 2:
                    self.task_type = TaskType.BINARY_CLASSIFICATION
                else:
                    self.task_type = TaskType.MULTICLASS_CLASSIFICATION
        else:
            self.task_type = TaskType.REGRESSION
        
        return self.task_type
    
    def get_data_size_category(self) -> str:
        """Categorize data size"""
        if self.data_size < 1000:
            return "small_data"
        elif self.data_size < 100000:
            return "medium_data"
        else:
            return "large_data"
    
    def get_recommendations(self, top_n: int = 5) -> Dict[str, Any]:
        """Get top N model recommendations"""
        
        # Detect task type if not already done
        if not self.task_type:
            self.detect_task_type()
        
        # Get data size category
        data_size_cat = self.get_data_size_category()
        
        # Get base recommendations
        if self.task_type in self.MODEL_CONFIGS:
            base_recommendations = self.MODEL_CONFIGS[self.task_type][data_size_cat]
        else:
            # Default to regression
            base_recommendations = self.MODEL_CONFIGS[TaskType.REGRESSION][data_size_cat]
        
        # Adjust scores based on specific characteristics
        adjusted_recommendations = self._adjust_scores(base_recommendations)
        
        # Sort by score and get top N
        sorted_recommendations = sorted(
            adjusted_recommendations,
            key=lambda x: x['score'],
            reverse=True
        )
        
        return {
            "task_type": self.task_type.value if self.task_type else "unknown",
            "data_size": self.data_size,
            "n_features": self.n_features,
            "data_size_category": data_size_cat,
            "recommendations": sorted_recommendations[:top_n],
            "reasoning": self._generate_reasoning()
        }
    
    def _adjust_scores(self, recommendations: List[Dict]) -> List[Dict]:
        """Adjust recommendation scores based on data characteristics"""
        adjusted = []
        
        for rec in recommendations:
            score = rec['score']
            
            # Boost score for high-dimensional data
            if self.n_features > 100:
                if rec['name'] in ['RandomForest', 'XGBoost', 'LightGBM']:
                    score += 0.02
            
            # Boost score for small feature count
            if self.n_features < 5:
                if rec['name'] in ['LogisticRegression', 'Ridge', 'LinearRegression']:
                    score += 0.03
            
            adjusted.append({
                **rec,
                'score': min(0.99, score)  # Cap at 0.99
            })
        
        return adjusted
    
    def _generate_reasoning(self) -> str:
        """Generate human-readable reasoning for recommendations"""
        data_size_cat = self.get_data_size_category()
        
        reasoning_map = {
            "small_data": "Your dataset has less than 1000 samples. Models are recommended based on their effectiveness with limited data, considering generalization and avoiding overfitting.",
            "medium_data": "Your dataset has 1,000-100,000 samples. Recommendations focus on models that balance performance and training time, with strong performance on mid-scale problems.",
            "large_data": "Your dataset has more than 100,000 samples. Recommendations prioritize models optimized for speed and efficiency while maintaining strong predictive performance."
        }
        
        return reasoning_map.get(data_size_cat, "")

# Helper function
def recommend_models(df: pd.DataFrame, target_column: str = None, top_n: int = 5) -> Dict[str, Any]:
    """Convenience function to get model recommendations"""
    recommender = ModelRecommender(df, target_column)
    return recommender.get_recommendations(top_n=top_n)
