import pytest
import time
import pandas as pd
import numpy as np
from app.ml_pipeline.model_training import ModelTrainer
from app.ml_pipeline.feature_engineering import engineer_features
from app.ml_pipeline.eda import ExploratoryDataAnalysis

def test_model_training_performance():
    """Test model training performance benchmark"""
    np.random.seed(42)
    X = pd.DataFrame(np.random.randn(200, 10))
    y = pd.Series(np.random.choice([0, 1], 200))
    
    trainer = ModelTrainer(X, y)
    
    start_time = time.time()
    results = trainer.train_multiple_models(
        model_names=['LogisticRegression', 'RandomForest'],
        test_size=0.2
    )
    elapsed = time.time() - start_time
    
    assert elapsed < 30, f"Training took {elapsed}s, max 30s allowed"
    assert len(results) == 2

def test_feature_engineering_performance():
    """Test feature engineering performance benchmark"""
    np.random.seed(42)
    X = pd.DataFrame(np.random.randn(300, 10))
    y = pd.Series(np.random.choice([0, 1], 300))
    
    start_time = time.time()
    X_engineered, summary = engineer_features(X, y, strategies=['statistical_features'])
    elapsed = time.time() - start_time
    
    assert elapsed < 15, f"Feature engineering took {elapsed}s, max 15s allowed"

def test_eda_performance():
    """Test EDA performance benchmark"""
    np.random.seed(42)
    df = pd.DataFrame({
        'numeric_' + str(i): np.random.randn(1000) for i in range(10)
    })
    
    start_time = time.time()
    eda = ExploratoryDataAnalysis(df)
    report = eda.get_full_report()
    elapsed = time.time() - start_time
    
    assert elapsed < 10, f"EDA took {elapsed}s, max 10s allowed"
