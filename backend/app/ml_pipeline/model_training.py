import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, KFold
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_squared_error, mean_absolute_error, r2_score, confusion_matrix, classification_report
)
import warnings
import time
import joblib
import os
from pathlib import Path

warnings.filterwarnings('ignore')

class TrainingError(Exception):
    """Custom exception for training errors"""
    pass

class ModelTrainer:
    """Train and evaluate machine learning models"""
    
    # Model mappings
    CLASSIFICATION_MODELS = {
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'SVM': SVC(probability=True, random_state=42),
        'KNN': KNeighborsClassifier(n_neighbors=5),
        'DecisionTree': DecisionTreeClassifier(random_state=42),
        'GradientBoosting': GradientBoostingClassifier(random_state=42),
    }
    
    REGRESSION_MODELS = {
        'LinearRegression': LinearRegression(),
        'Ridge': Ridge(random_state=42),
        'Lasso': Lasso(random_state=42),
        'RandomForest': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        'SVR': SVR(),
        'KNN': KNeighborsRegressor(n_neighbors=5),
        'DecisionTree': DecisionTreeRegressor(random_state=42),
        'GradientBoosting': GradientBoostingRegressor(random_state=42),
    }
    
    def __init__(self, X: pd.DataFrame, y: pd.Series, task_type: str = 'classification', model_dir: str = './models'):
        self.X = X
        self.y = y
        self.task_type = task_type
        self.model_dir = model_dir
        self.models = {}
        self.results = {}
        
        os.makedirs(model_dir, exist_ok=True)
    
    def split_data(self, test_size: float = 0.2, random_state: int = 42) -> Tuple:
        """Split data into train and test sets"""
        try:
            # Check if stratification is possible (need at least 2 samples per class)
            stratify = None
            if self.task_type == 'classification':
                class_counts = self.y.value_counts()
                if (class_counts >= 2).all():
                    stratify = self.y

            X_train, X_test, y_train, y_test = train_test_split(
                self.X, self.y,
                test_size=test_size,
                random_state=random_state,
                stratify=stratify
            )
            
            return X_train, X_test, y_train, y_test
        
        except Exception as e:
            raise TrainingError(f"Failed to split data: {str(e)}")
    
    def train_single_model(
        self,
        model_name: str,
        X_train: pd.DataFrame,
        X_test: pd.DataFrame,
        y_train: pd.Series,
        y_test: pd.Series
    ) -> Dict[str, Any]:
        """Train a single model and return results"""
        try:
            # Select model
            if self.task_type == 'classification':
                if model_name not in self.CLASSIFICATION_MODELS:
                    raise TrainingError(f"Model {model_name} not found in classification models")
                model = self.CLASSIFICATION_MODELS[model_name]
            else:
                if model_name not in self.REGRESSION_MODELS:
                    raise TrainingError(f"Model {model_name} not found in regression models")
                model = self.REGRESSION_MODELS[model_name]
            
            # Train model
            start_time = time.time()
            model.fit(X_train, y_train)
            training_time = time.time() - start_time
            
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            metrics = self._calculate_metrics(y_test, y_pred, model, X_test)
            
            # Store model
            self.models[model_name] = model
            
            # Cross-validation
            try:
                if self.task_type == 'classification':
                    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
                else:
                    cv = KFold(n_splits=5, shuffle=True, random_state=42)
                
                cv_scores = cross_val_score(
                    model, self.X, self.y,
                    cv=cv,
                    scoring='accuracy' if self.task_type == 'classification' else 'r2'
                )
                cv_mean = float(cv_scores.mean())
                cv_std = float(cv_scores.std())
            except Exception:
                cv_mean = 0.0
                cv_std = 0.0
            
            result = {
                "model_name": model_name,
                "metrics": metrics,
                "training_time_seconds": training_time,
                "cross_val_mean": cv_mean,
                "cross_val_std": cv_std,
                "test_size": len(X_test),
                "train_size": len(X_train),
            }
            
            self.results[model_name] = result
            
            return result
        
        except Exception as e:
            raise TrainingError(f"Failed to train {model_name}: {str(e)}")
    
    def _calculate_metrics(self, y_test: pd.Series, y_pred, model, X_test: pd.DataFrame) -> Dict[str, float]:
        """Calculate metrics based on task type"""
        metrics = {}
        
        try:
            if self.task_type == 'classification':
                metrics['accuracy'] = float(accuracy_score(y_test, y_pred))
                metrics['precision'] = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                metrics['recall'] = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                metrics['f1'] = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
                
                # Try to calculate ROC-AUC
                try:
                    if hasattr(model, 'predict_proba'):
                        y_proba = model.predict_proba(X_test)
                        if len(np.unique(y_test)) == 2:  # Binary classification
                            metrics['roc_auc'] = float(roc_auc_score(y_test, y_proba[:, 1]))
                        else:  # Multiclass
                            metrics['roc_auc'] = float(roc_auc_score(
                                y_test, y_proba,
                                multi_class='ovr',
                                average='weighted'
                            ))
                except Exception:
                    metrics['roc_auc'] = None
                
                # Confusion matrix
                cm = confusion_matrix(y_test, y_pred)
                metrics['confusion_matrix'] = cm.tolist()
            
            else:  # Regression
                metrics['mse'] = float(mean_squared_error(y_test, y_pred))
                metrics['rmse'] = float(np.sqrt(mean_squared_error(y_test, y_pred)))
                metrics['mae'] = float(mean_absolute_error(y_test, y_pred))
                metrics['r2'] = float(r2_score(y_test, y_pred))
        
        except Exception as e:
            print(f"Warning: Failed to calculate some metrics: {str(e)}")
        
        return metrics
    
    def train_multiple_models(
        self,
        model_names: List[str] = None,
        test_size: float = 0.2
    ) -> List[Dict[str, Any]]:
        """Train multiple models and return results"""
        
        try:
            # Split data
            X_train, X_test, y_train, y_test = self.split_data(test_size=test_size)
            
            # Select models to train
            if model_names is None:
                if self.task_type == 'classification':
                    model_names = list(self.CLASSIFICATION_MODELS.keys())
                else:
                    model_names = list(self.REGRESSION_MODELS.keys())
            
            # Train each model
            results = []
            for model_name in model_names:
                try:
                    result = self.train_single_model(model_name, X_train, X_test, y_train, y_test)
                    results.append(result)
                except TrainingError as e:
                    print(f"Error training {model_name}: {str(e)}")
                    results.append({
                        "model_name": model_name,
                        "error": str(e),
                        "status": "failed"
                    })
            
            return results
        
        except Exception as e:
            raise TrainingError(f"Failed to train models: {str(e)}")
    
    def save_model(self, model_name: str) -> str:
        """Save trained model to disk"""
        try:
            if model_name not in self.models:
                raise TrainingError(f"Model {model_name} not found")
            
            model_path = os.path.join(self.model_dir, f"{model_name}.pkl")
            joblib.dump(self.models[model_name], model_path)
            
            return model_path
        
        except Exception as e:
            raise TrainingError(f"Failed to save model: {str(e)}")
    
    def save_all_models(self) -> Dict[str, str]:
        """Save all trained models"""
        saved_models = {}
        for model_name in self.models.keys():
            saved_models[model_name] = self.save_model(model_name)
        return saved_models
    
    def get_best_model(self) -> Tuple[str, Dict[str, Any]]:
        """Get best performing model based on primary metric"""
        try:
            if not self.results:
                raise TrainingError("No models trained yet")
            
            best_model_name = None
            best_score = -np.inf
            
            for model_name, result in self.results.items():
                if 'error' in result:
                    continue
                
                # Get primary metric
                if self.task_type == 'classification':
                    score = result['metrics'].get('f1', 0)
                else:
                    score = result['metrics'].get('r2', 0)
                
                if score > best_score:
                    best_score = score
                    best_model_name = model_name
            
            if best_model_name is None:
                raise TrainingError("No valid models trained")
            
            return best_model_name, self.results[best_model_name]
        
        except Exception as e:
            raise TrainingError(f"Failed to get best model: {str(e)}")

# Helper function
def train_models(
    X: pd.DataFrame,
    y: pd.Series,
    model_names: List[str] = None,
    task_type: str = 'classification',
    test_size: float = 0.2
) -> Tuple[List[Dict], str, Dict]:
    """Convenience function to train models"""
    trainer = ModelTrainer(X, y, task_type=task_type)
    results = trainer.train_multiple_models(model_names=model_names, test_size=test_size)
    best_model, best_result = trainer.get_best_model()
    trainer.save_all_models()
    
    return results, best_model, best_result
