import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression, Ridge
from app.ml_pipeline.hyperparameter_tuning import HyperparameterTuner, tune_model

def test_hyperparameter_tuner_random():
    np.random.seed(42)
    X = pd.DataFrame({
        'f1': np.random.randn(80),
        'f2': np.random.randn(80)
    })
    y = pd.Series(np.random.choice([0, 1], 80))
    
    model = LogisticRegression()
    tuner = HyperparameterTuner(model, X, y, task_type='classification', cv_folds=3)
    best_model, best_params, t_time = tuner.random_search_tune('LogisticRegression', n_iter=3)
    
    assert best_model is not None
    assert isinstance(best_params, dict)
    assert t_time > 0

def test_hyperparameter_tuner_regression():
    np.random.seed(42)
    X = pd.DataFrame({
        'f1': np.random.randn(80),
        'f2': np.random.randn(80)
    })
    y = pd.Series(np.random.randn(80))
    
    model = Ridge()
    tuner = HyperparameterTuner(model, X, y, task_type='regression', cv_folds=3)
    best_model, best_params, t_time = tuner.grid_search_tune('Ridge')
    
    assert best_model is not None
    assert 'alpha' in best_params
