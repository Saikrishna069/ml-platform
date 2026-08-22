import pandas as pd
import numpy as np
from app.ml_pipeline.model_training import ModelTrainer, train_models
from app.ml_pipeline.model_selector import recommend_models, ModelRecommender

def test_model_trainer_classification():
    """Test training classification models"""
    # Create sample data
    np.random.seed(42)
    X = pd.DataFrame({
        'feature1': np.random.randn(100),
        'feature2': np.random.randn(100),
        'feature3': np.random.randn(100),
    })
    y = pd.Series(np.random.choice([0, 1], 100))
    
    # Train models
    trainer = ModelTrainer(X, y, task_type='classification')
    results = trainer.train_multiple_models(
        model_names=['LogisticRegression', 'RandomForest'],
        test_size=0.2
    )
    
    assert len(results) == 2
    assert all('model_name' in r for r in results)
    assert all('metrics' in r for r in results if 'error' not in r)

def test_model_trainer_regression():
    """Test training regression models"""
    np.random.seed(42)
    X = pd.DataFrame({
        'feature1': np.random.randn(100),
        'feature2': np.random.randn(100),
    })
    y = pd.Series(np.random.randn(100))
    
    trainer = ModelTrainer(X, y, task_type='regression')
    results = trainer.train_multiple_models(
        model_names=['LinearRegression', 'Ridge'],
        test_size=0.2
    )
    
    assert len(results) == 2
    assert all('r2' in r['metrics'] or 'error' in r for r in results)

def test_get_best_model():
    """Test getting best model"""
    np.random.seed(42)
    X = pd.DataFrame({
        'feature1': np.random.randn(100),
        'feature2': np.random.randn(100),
    })
    y = pd.Series(np.random.choice([0, 1], 100))
    
    trainer = ModelTrainer(X, y, task_type='classification')
    results = trainer.train_multiple_models(
        model_names=['LogisticRegression', 'RandomForest'],
        test_size=0.2
    )
    
    best_model, best_result = trainer.get_best_model()
    
    assert best_model is not None
    assert 'metrics' in best_result

def test_model_recommender():
    """Test model recommendation"""
    np.random.seed(42)
    df = pd.DataFrame({
        'feature1': np.random.randn(500),
        'feature2': np.random.randn(500),
        'target': np.random.choice([0, 1], 500)
    })
    
    recommendations = recommend_models(df, target_column='target', top_n=5)
    
    assert 'recommendations' in recommendations
    assert len(recommendations['recommendations']) <= 5
    assert 'task_type' in recommendations

def test_model_recommender_small_data():
    """Test model recommendation for small dataset"""
    np.random.seed(42)
    df = pd.DataFrame({
        'feature1': np.random.randn(50),
        'feature2': np.random.randn(50),
        'target': np.random.choice([0, 1], 50)
    })
    
    recommender = ModelRecommender(df, target_column='target')
    category = recommender.get_data_size_category()
    
    assert category == "small_data"

def test_model_recommender_large_data():
    """Test model recommendation for large dataset"""
    np.random.seed(42)
    df = pd.DataFrame({
        'feature1': np.random.randn(150000),
        'feature2': np.random.randn(150000),
        'target': np.random.choice([0, 1], 150000)
    })
    
    recommender = ModelRecommender(df, target_column='target')
    category = recommender.get_data_size_category()
    
    assert category == "large_data"
