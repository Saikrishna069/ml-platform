import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.linear_model import LogisticRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
import warnings
import time

warnings.filterwarnings('ignore')

class HyperparameterTuningError(Exception):
    """Custom exception for hyperparameter tuning errors"""
    pass

class HyperparameterTuner:
    """Tune hyperparameters for machine learning models"""
    
    # Hyperparameter grids for different models
    PARAM_GRIDS = {
        'LogisticRegression': {
            'C': [0.001, 0.01, 0.1, 1, 10, 100],
            'penalty': ['l2'],
            'solver': ['lbfgs'],
            'max_iter': [100, 500, 1000]
        },
        'RandomForest': {
            'n_estimators': [50, 100, 200, 300],
            'max_depth': [5, 10, 15, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2']
        },
        'SVM': {
            'C': [0.1, 1, 10, 100],
            'kernel': ['linear', 'rbf', 'poly'],
            'gamma': ['scale', 'auto']
        },
        'KNN': {
            'n_neighbors': [3, 5, 7, 9, 11, 15],
            'weights': ['uniform', 'distance'],
            'metric': ['euclidean', 'manhattan']
        },
        'GradientBoosting': {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.001, 0.01, 0.1],
            'max_depth': [3, 5, 7],
            'min_samples_split': [2, 5, 10],
            'subsample': [0.8, 0.9, 1.0]
        },
        'Ridge': {
            'alpha': [0.001, 0.01, 0.1, 1, 10, 100],
            'solver': ['auto', 'svd', 'cholesky', 'lsqr']
        },
        'Lasso': {
            'alpha': [0.0001, 0.001, 0.01, 0.1, 1, 10],
            'max_iter': [1000, 5000, 10000]
        }
    }
    
    # Smaller grids for quick tuning
    PARAM_GRIDS_SMALL = {
        'LogisticRegression': {
            'C': [0.1, 1, 10],
            'max_iter': [100, 500]
        },
        'RandomForest': {
            'n_estimators': [50, 100, 200],
            'max_depth': [5, 10, None]
        },
        'SVM': {
            'C': [0.1, 1, 10],
            'kernel': ['linear', 'rbf']
        },
        'KNN': {
            'n_neighbors': [3, 5, 7, 9],
            'weights': ['uniform', 'distance']
        },
        'GradientBoosting': {
            'n_estimators': [50, 100],
            'learning_rate': [0.01, 0.1],
            'max_depth': [3, 5]
        },
        'Ridge': {
            'alpha': [0.1, 1, 10]
        },
        'Lasso': {
            'alpha': [0.01, 0.1, 1]
        }
    }
    
    def __init__(self, model, X_train: pd.DataFrame, y_train: pd.Series, 
                 task_type: str = 'classification', cv_folds: int = 5):
        self.model = model
        self.X_train = X_train
        self.y_train = y_train
        self.task_type = task_type
        self.cv_folds = cv_folds
        self.best_model = None
        self.best_params = None
        self.best_score = None
    
    def get_param_grid(self, model_name: str, quick: bool = False) -> Dict:
        """Get hyperparameter grid for a model"""
        if quick:
            return self.PARAM_GRIDS_SMALL.get(model_name, {})
        return self.PARAM_GRIDS.get(model_name, {})
    
    def grid_search_tune(self, model_name: str, param_grid: Dict = None, 
                        n_jobs: int = -1) -> Tuple[Any, Dict, float]:
        """Perform grid search hyperparameter tuning"""
        try:
            if param_grid is None:
                param_grid = self.get_param_grid(model_name, quick=True)
            
            if not param_grid:
                raise HyperparameterTuningError(f"No param grid found for {model_name}")
            
            # Determine scoring metric
            scoring = 'accuracy' if self.task_type == 'classification' else 'r2'
            
            start_time = time.time()
            
            grid_search = GridSearchCV(
                self.model,
                param_grid,
                cv=min(self.cv_folds, len(self.X_train)),
                n_jobs=n_jobs,
                scoring=scoring,
                verbose=0
            )
            
            grid_search.fit(self.X_train, self.y_train)
            
            tuning_time = time.time() - start_time
            
            self.best_model = grid_search.best_estimator_
            self.best_params = grid_search.best_params_
            self.best_score = float(grid_search.best_score_)
            
            return self.best_model, self.best_params, tuning_time
        
        except Exception as e:
            raise HyperparameterTuningError(f"Grid search failed: {str(e)}")
    
    def random_search_tune(self, model_name: str, param_distributions: Dict = None,
                          n_iter: int = 15, n_jobs: int = -1) -> Tuple[Any, Dict, float]:
        """Perform random search hyperparameter tuning"""
        try:
            if param_distributions is None:
                param_distributions = self.get_param_grid(model_name, quick=False)
            
            if not param_distributions:
                raise HyperparameterTuningError(f"No param grid found for {model_name}")
            
            scoring = 'accuracy' if self.task_type == 'classification' else 'r2'
            
            start_time = time.time()
            
            random_search = RandomizedSearchCV(
                self.model,
                param_distributions,
                n_iter=min(n_iter, 20),
                cv=min(self.cv_folds, len(self.X_train)),
                n_jobs=n_jobs,
                scoring=scoring,
                random_state=42,
                verbose=0
            )
            
            random_search.fit(self.X_train, self.y_train)
            
            tuning_time = time.time() - start_time
            
            self.best_model = random_search.best_estimator_
            self.best_params = random_search.best_params_
            self.best_score = float(random_search.best_score_)
            
            return self.best_model, self.best_params, tuning_time
        
        except Exception as e:
            raise HyperparameterTuningError(f"Random search failed: {str(e)}")
    
    def bayesian_tune(self, model_name: str, n_calls: int = 15,
                     n_jobs: int = -1) -> Tuple[Any, Dict, float]:
        """Perform Bayesian optimization for hyperparameter tuning with safe fallback"""
        try:
            from skopt import gp_minimize
            from skopt.space import Real, Integer, Categorical
            from sklearn.model_selection import cross_val_score
            
            param_grid = self.get_param_grid(model_name, quick=False)
            
            if not param_grid:
                raise HyperparameterTuningError(f"No param grid found for {model_name}")
            
            space = []
            param_names = []
            
            for param_name, param_values in param_grid.items():
                param_names.append(param_name)
                if isinstance(param_values[0], (int, np.integer)):
                    space.append(Integer(min(param_values), max(param_values)))
                elif isinstance(param_values[0], (float, np.floating)):
                    space.append(Real(min(param_values), max(param_values)))
                else:
                    space.append(Categorical(param_values))
            
            def objective(params):
                param_dict = dict(zip(param_names, params))
                model_copy = self.model.__class__(**param_dict)
                scoring = 'accuracy' if self.task_type == 'classification' else 'r2'
                scores = cross_val_score(
                    model_copy, self.X_train, self.y_train,
                    cv=self.cv_folds, scoring=scoring
                )
                return -scores.mean()
            
            start_time = time.time()
            result = gp_minimize(
                objective, space, n_calls=n_calls, random_state=42, n_jobs=n_jobs, verbose=0
            )
            tuning_time = time.time() - start_time
            
            best_params_list = result.x
            self.best_params = dict(zip(param_names, best_params_list))
            self.best_score = float(-result.fun)
            
            self.best_model = self.model.__class__(**self.best_params)
            self.best_model.fit(self.X_train, self.y_train)
            
            return self.best_model, self.best_params, tuning_time
        
        except Exception:
            # Fallback to random search if skopt unavailable or fails
            return self.random_search_tune(model_name, n_iter=n_calls, n_jobs=n_jobs)
    
    def get_tuning_report(self) -> Dict[str, Any]:
        """Generate tuning report"""
        return {
            "best_params": self.best_params,
            "best_score": float(self.best_score) if self.best_score else None,
            "model_type": type(self.best_model).__name__ if self.best_model else None
        }

def tune_model(model, X_train: pd.DataFrame, y_train: pd.Series,
               model_name: str, tuning_method: str = 'random',
               task_type: str = 'classification') -> Tuple[Any, Dict, float]:
    """Convenience function to tune a model"""
    tuner = HyperparameterTuner(model, X_train, y_train, task_type=task_type)
    if tuning_method == 'grid':
        return tuner.grid_search_tune(model_name)
    elif tuning_method == 'bayesian':
        return tuner.bayesian_tune(model_name, n_calls=10)
    else:
        return tuner.random_search_tune(model_name, n_iter=10)
