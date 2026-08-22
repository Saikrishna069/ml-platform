import pandas as pd
import numpy as np
from app.ml_pipeline.preprocessing import DataPreprocessor

def test_handle_missing_values():
    """Test handling missing values"""
    df = pd.DataFrame({
        'A': [1, 2, np.nan, 4],
        'B': [5, np.nan, 7, 8],
        'C': ['a', 'b', None, 'd']
    })
    
    preprocessor = DataPreprocessor(df)
    preprocessor.handle_missing_values()
    result_df, _ = preprocessor.get_preprocessed_data()
    
    assert result_df.isnull().sum().sum() == 0, "Missing values still exist"

def test_remove_duplicates():
    """Test removing duplicates"""
    df = pd.DataFrame({
        'A': [1, 1, 2, 3],
        'B': [4, 4, 5, 6]
    })
    
    preprocessor = DataPreprocessor(df)
    preprocessor.remove_duplicates()
    result_df, _ = preprocessor.get_preprocessed_data()
    
    assert len(result_df) == 3, "Duplicates not removed correctly"

def test_scale_numeric_features():
    """Test scaling numeric features"""
    df = pd.DataFrame({
        'A': [1, 2, 3, 4, 5],
        'B': [10, 20, 30, 40, 50]
    })
    
    preprocessor = DataPreprocessor(df)
    preprocessor.scale_numeric_features(method='standard')
    result_df, _ = preprocessor.get_preprocessed_data()
    
    # Check that values are standardized (mean~0, std~1)
    assert abs(result_df['A'].mean()) < 0.01, "Scaling not applied correctly"
    assert abs(result_df['A'].std() - 1.0) < 0.01, "Scaling not applied correctly"

def test_encode_categorical_features():
    """Test encoding categorical features"""
    df = pd.DataFrame({
        'A': [1, 2, 3, 4],
        'B': ['cat', 'dog', 'cat', 'bird']
    })
    
    preprocessor = DataPreprocessor(df)
    preprocessor.encode_categorical_features(method='label')
    result_df, _ = preprocessor.get_preprocessed_data()
    
    assert result_df['B'].dtype in [np.int64, np.int32, np.int8, np.int16], "Encoding not applied"
    assert result_df['B'].nunique() == 3, "Unique values changed during encoding"

def test_auto_preprocess():
    """Test automatic preprocessing"""
    df = pd.DataFrame({
        'A': [1, 2, np.nan, 4],
        'B': [5.0, 10.0, 15.0, 20.0],
        'C': ['cat', 'dog', 'cat', 'bird']
    })
    
    result_df, summary = DataPreprocessor.auto_preprocess(df)
    
    assert result_df.isnull().sum().sum() == 0, "Missing values still exist"
    assert 'preprocessing_steps' in summary
    assert len(summary['preprocessing_steps']) > 0
