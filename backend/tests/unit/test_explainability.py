import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from app.ml_pipeline.explainability import ModelExplainer

def test_explainability_tree_importance():
    np.random.seed(42)
    X = pd.DataFrame({
        'f1': np.random.randn(60),
        'f2': np.random.randn(60)
    })
    y = pd.Series(np.random.choice([0, 1], 60))
    
    rf = RandomForestClassifier(n_estimators=10, random_state=42)
    rf.fit(X, y)
    
    explainer = ModelExplainer(rf, X, y)
    importance = explainer.get_feature_importance()
    
    assert 'f1' in importance
    assert 'f2' in importance

def test_explainability_coefficients():
    np.random.seed(42)
    X = pd.DataFrame({
        'f1': np.random.randn(60),
        'f2': np.random.randn(60)
    })
    y = pd.Series(np.random.choice([0, 1], 60))
    
    lr = LogisticRegression()
    lr.fit(X, y)
    
    explainer = ModelExplainer(lr, X, y)
    coefs = explainer.get_coefficients()
    
    assert 'f1' in coefs
    assert 'f2' in coefs
