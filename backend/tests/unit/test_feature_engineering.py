import pandas as pd
import numpy as np
from app.ml_pipeline.feature_engineering import FeatureEngineer, engineer_features

def test_feature_engineering_pipeline():
    np.random.seed(42)
    X = pd.DataFrame({
        'num1': np.random.randn(50),
        'num2': np.random.randn(50),
        'constant': np.ones(50)  # low variance
    })
    y = pd.Series(np.random.choice([0, 1], 50))
    
    engineer = FeatureEngineer(X, y, task_type='classification')
    engineer.create_statistical_features()
    engineer.drop_low_variance_features()
    
    X_engineered, steps = engineer.get_engineered_data()
    summary = engineer.get_summary()
    
    assert 'constant' not in X_engineered.columns
    assert 'mean' in X_engineered.columns
    assert summary['final_features'] > 0

def test_engineer_features_helper():
    np.random.seed(42)
    X = pd.DataFrame({
        'a': np.random.randn(30),
        'b': np.random.randn(30)
    })
    y = pd.Series(np.random.randn(30))
    
    X_out, summary = engineer_features(X, y, task_type='regression', strategies=['statistical_features'])
    assert 'sum' in X_out.columns
