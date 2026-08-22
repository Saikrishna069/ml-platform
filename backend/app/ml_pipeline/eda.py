import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from collections import Counter
import warnings

warnings.filterwarnings('ignore')

class EDAError(Exception):
    """Custom exception for EDA errors"""
    pass

class ExploratoryDataAnalysis:
    """Perform comprehensive exploratory data analysis"""
    
    def __init__(self, df: pd.DataFrame):
        if df.empty:
            raise EDAError("DataFrame is empty")
        self.df = df.copy()
    
    def get_basic_statistics(self) -> Dict[str, Any]:
        """Get basic statistics about the dataset"""
        try:
            stats = {
                "shape": {"n_rows": len(self.df), "n_columns": len(self.df.columns)},
                "size_mb": self.df.memory_usage(deep=True).sum() / 1024 / 1024,
                "columns": self.df.columns.tolist(),
                "dtypes": self.df.dtypes.astype(str).to_dict(),
                "duplicates": int(len(self.df) - len(self.df.drop_duplicates())),
                "duplicate_percentage": float((len(self.df) - len(self.df.drop_duplicates())) / len(self.df) * 100),
            }
            
            return stats
        
        except Exception as e:
            raise EDAError(f"Failed to compute basic statistics: {str(e)}")
    
    def get_missing_values(self) -> Dict[str, Any]:
        """Analyze missing values"""
        try:
            missing_counts = self.df.isnull().sum()
            missing_percentage = (self.df.isnull().sum() / len(self.df) * 100).round(2)
            
            missing_data = {
                "columns_with_missing": [],
                "total_missing": int(missing_counts.sum()),
                "total_missing_percentage": float((missing_counts.sum() / (len(self.df) * len(self.df.columns)) * 100).round(2)),
            }
            
            for col in self.df.columns:
                if missing_counts[col] > 0:
                    missing_data["columns_with_missing"].append({
                        "column": col,
                        "missing_count": int(missing_counts[col]),
                        "missing_percentage": float(missing_percentage[col])
                    })
            
            # Sort by missing percentage
            missing_data["columns_with_missing"].sort(
                key=lambda x: x["missing_percentage"],
                reverse=True
            )
            
            return missing_data
        
        except Exception as e:
            raise EDAError(f"Failed to analyze missing values: {str(e)}")
    
    def get_data_types_summary(self) -> Dict[str, Any]:
        """Summarize data types in dataset"""
        try:
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
            datetime_cols = self.df.select_dtypes(include=['datetime64']).columns.tolist()
            
            return {
                "numeric_columns": numeric_cols,
                "n_numeric": len(numeric_cols),
                "categorical_columns": categorical_cols,
                "n_categorical": len(categorical_cols),
                "datetime_columns": datetime_cols,
                "n_datetime": len(datetime_cols),
            }
        
        except Exception as e:
            raise EDAError(f"Failed to summarize data types: {str(e)}")
    
    def get_numerical_statistics(self) -> Dict[str, Any]:
        """Get detailed statistics for numerical columns"""
        try:
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
            
            stats = {}
            for col in numeric_cols:
                col_data = self.df[col].dropna()
                if len(col_data) == 0:
                    continue
                
                stats[col] = {
                    "count": int(len(col_data)),
                    "mean": float(col_data.mean()),
                    "median": float(col_data.median()),
                    "std": float(col_data.std()) if len(col_data) > 1 else 0.0,
                    "min": float(col_data.min()),
                    "max": float(col_data.max()),
                    "q1": float(col_data.quantile(0.25)),
                    "q3": float(col_data.quantile(0.75)),
                    "iqr": float(col_data.quantile(0.75) - col_data.quantile(0.25)),
                    "skewness": float(col_data.skew()) if len(col_data) > 2 else 0.0,
                    "kurtosis": float(col_data.kurtosis()) if len(col_data) > 3 else 0.0,
                }
            
            return stats
        
        except Exception as e:
            raise EDAError(f"Failed to compute numerical statistics: {str(e)}")
    
    def get_categorical_statistics(self, max_categories: int = 10) -> Dict[str, Any]:
        """Get detailed statistics for categorical columns"""
        try:
            categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
            
            stats = {}
            for col in categorical_cols:
                value_counts = self.df[col].value_counts()
                
                stats[col] = {
                    "unique_values": int(len(value_counts)),
                    "top_value": str(value_counts.index[0]) if len(value_counts) > 0 else None,
                    "top_value_count": int(value_counts.iloc[0]) if len(value_counts) > 0 else 0,
                    "top_values": [
                        {
                            "value": str(idx),
                            "count": int(val),
                            "percentage": float(val / len(self.df) * 100)
                        }
                        for idx, val in value_counts.head(max_categories).items()
                    ],
                }
            
            return stats
        
        except Exception as e:
            raise EDAError(f"Failed to compute categorical statistics: {str(e)}")
    
    def detect_outliers(self, method: str = "iqr") -> Dict[str, Any]:
        """Detect outliers using IQR or Z-score method"""
        try:
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
            
            outliers = {}
            
            if method == "iqr":
                for col in numeric_cols:
                    Q1 = self.df[col].quantile(0.25)
                    Q3 = self.df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    outlier_indices = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)
                    outlier_count = outlier_indices.sum()
                    
                    if outlier_count > 0:
                        outliers[col] = {
                            "outlier_count": int(outlier_count),
                            "outlier_percentage": float(outlier_count / len(self.df) * 100),
                            "lower_bound": float(lower_bound),
                            "upper_bound": float(upper_bound),
                        }
            
            return outliers
        
        except Exception as e:
            raise EDAError(f"Failed to detect outliers: {str(e)}")
    
    def get_correlations(self) -> Dict[str, Any]:
        """Compute correlations between numeric columns"""
        try:
            numeric_df = self.df.select_dtypes(include=[np.number])
            
            if len(numeric_df.columns) < 2:
                return {"message": "Not enough numeric columns for correlation"}
            
            correlation_matrix = numeric_df.corr().round(3)
            
            # Get top correlations
            corr_pairs = []
            for i in range(len(correlation_matrix.columns)):
                for j in range(i + 1, len(correlation_matrix.columns)):
                    corr_value = correlation_matrix.iloc[i, j]
                    if pd.isna(corr_value):
                        continue
                    col1 = correlation_matrix.columns[i]
                    col2 = correlation_matrix.columns[j]
                    
                    if abs(corr_value) > 0.3:  # Only show moderate+ correlations
                        corr_pairs.append({
                            "column1": col1,
                            "column2": col2,
                            "correlation": float(corr_value)
                        })
            
            # Sort by absolute correlation
            corr_pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)
            
            return {
                "top_correlations": corr_pairs[:10],
                "total_pairs": len(corr_pairs),
                "correlation_matrix": correlation_matrix.fillna(0).to_dict()
            }
        
        except Exception as e:
            raise EDAError(f"Failed to compute correlations: {str(e)}")
    
    def get_full_report(self) -> Dict[str, Any]:
        """Generate complete EDA report"""
        try:
            report = {
                "basic_statistics": self.get_basic_statistics(),
                "data_types": self.get_data_types_summary(),
                "missing_values": self.get_missing_values(),
                "numerical_statistics": self.get_numerical_statistics(),
                "categorical_statistics": self.get_categorical_statistics(),
                "outliers": self.detect_outliers(),
                "correlations": self.get_correlations(),
            }
            
            return report
        
        except Exception as e:
            raise EDAError(f"Failed to generate EDA report: {str(e)}")

# Helper function
def perform_eda(df: pd.DataFrame) -> Dict[str, Any]:
    """Convenience function to perform EDA"""
    eda = ExploratoryDataAnalysis(df)
    return eda.get_full_report()
