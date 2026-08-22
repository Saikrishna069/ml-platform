import pandas as pd
import numpy as np
from app.ml_pipeline.eda import ExploratoryDataAnalysis

def test_get_basic_statistics():
    """Test basic statistics calculation"""
    df = pd.DataFrame({
        'A': [1, 2, 3, 4, 5],
        'B': [10, 20, 30, 40, 50]
    })
    
    eda = ExploratoryDataAnalysis(df)
    stats = eda.get_basic_statistics()
    
    assert stats['shape']['n_rows'] == 5
    assert stats['shape']['n_columns'] == 2

def test_get_missing_values():
    """Test missing values analysis"""
    df = pd.DataFrame({
        'A': [1, np.nan, 3],
        'B': [4, 5, 6]
    })
    
    eda = ExploratoryDataAnalysis(df)
    missing = eda.get_missing_values()
    
    assert missing['total_missing'] == 1
    assert len(missing['columns_with_missing']) == 1

def test_get_data_types_summary():
    """Test data types summary"""
    df = pd.DataFrame({
        'A': [1, 2, 3],
        'B': [1.5, 2.5, 3.5],
        'C': ['a', 'b', 'c']
    })
    
    eda = ExploratoryDataAnalysis(df)
    types_summary = eda.get_data_types_summary()
    
    assert types_summary['n_numeric'] == 2
    assert types_summary['n_categorical'] == 1

def test_get_numerical_statistics():
    """Test numerical statistics"""
    df = pd.DataFrame({
        'A': [1, 2, 3, 4, 5]
    })
    
    eda = ExploratoryDataAnalysis(df)
    num_stats = eda.get_numerical_statistics()
    
    assert 'A' in num_stats
    assert num_stats['A']['mean'] == 3.0
    assert num_stats['A']['count'] == 5

def test_get_full_report():
    """Test full EDA report"""
    df = pd.DataFrame({
        'A': [1, 2, 3, 4, 5],
        'B': [10.0, 20.0, 30.0, 40.0, 50.0],
        'C': ['cat', 'dog', 'cat', 'bird', 'dog']
    })
    
    eda = ExploratoryDataAnalysis(df)
    report = eda.get_full_report()
    
    assert 'basic_statistics' in report
    assert 'data_types' in report
    assert 'missing_values' in report
    assert 'numerical_statistics' in report
    assert 'categorical_statistics' in report
