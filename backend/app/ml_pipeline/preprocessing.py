import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
import warnings

warnings.filterwarnings('ignore')

class PreprocessingError(Exception):
    """Custom exception for preprocessing errors"""
    pass

class DataPreprocessor:
    """Handle data preprocessing tasks"""
    
    def __init__(self, df: pd.DataFrame):
        if df.empty:
            raise PreprocessingError("DataFrame is empty")
        self.df = df.copy()
        self.original_df = df.copy()
        self.transformers = {}
        self.preprocessing_steps = []
    
    def handle_missing_values(
        self,
        strategy: str = "mean",
        numeric_strategy: str = "mean",
        categorical_strategy: str = "most_frequent"
    ) -> "DataPreprocessor":
        """Handle missing values"""
        try:
            # Separate numeric and categorical columns
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
            
            # Handle numeric columns
            if numeric_cols:
                numeric_imputer = SimpleImputer(strategy=numeric_strategy)
                self.df[numeric_cols] = numeric_imputer.fit_transform(self.df[numeric_cols])
                self.transformers['numeric_imputer'] = numeric_imputer
            
            # Handle categorical columns
            if categorical_cols:
                categorical_imputer = SimpleImputer(strategy=categorical_strategy)
                self.df[categorical_cols] = categorical_imputer.fit_transform(self.df[categorical_cols])
                self.transformers['categorical_imputer'] = categorical_imputer
            
            self.preprocessing_steps.append({
                "step": "handle_missing_values",
                "strategy": strategy,
                "numeric_strategy": numeric_strategy,
                "categorical_strategy": categorical_strategy
            })
            
            return self
        
        except Exception as e:
            raise PreprocessingError(f"Failed to handle missing values: {str(e)}")
    
    def remove_duplicates(self, subset: List[str] = None, keep: str = 'first') -> "DataPreprocessor":
        """Remove duplicate rows"""
        try:
            before_count = len(self.df)
            self.df = self.df.drop_duplicates(subset=subset, keep=keep)
            after_count = len(self.df)
            removed_count = before_count - after_count
            
            self.preprocessing_steps.append({
                "step": "remove_duplicates",
                "removed_rows": removed_count,
                "kept_rows": after_count
            })
            
            return self
        
        except Exception as e:
            raise PreprocessingError(f"Failed to remove duplicates: {str(e)}")
    
    def remove_outliers(self, method: str = "iqr", threshold: float = 1.5) -> "DataPreprocessor":
        """Remove outliers using IQR or Z-score"""
        try:
            before_count = len(self.df)
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
            
            if method == "iqr":
                for col in numeric_cols:
                    Q1 = self.df[col].quantile(0.25)
                    Q3 = self.df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    
                    lower_bound = Q1 - threshold * IQR
                    upper_bound = Q3 + threshold * IQR
                    
                    self.df = self.df[
                        (self.df[col] >= lower_bound) & (self.df[col] <= upper_bound)
                    ]
            
            elif method == "zscore":
                from scipy import stats
                for col in numeric_cols:
                    std_val = self.df[col].std()
                    if std_val > 0:
                        z_scores = np.abs(stats.zscore(self.df[col].fillna(self.df[col].mean())))
                        self.df = self.df[z_scores < threshold]
            
            after_count = len(self.df)
            removed_count = before_count - after_count
            
            self.preprocessing_steps.append({
                "step": "remove_outliers",
                "method": method,
                "removed_rows": removed_count,
                "kept_rows": after_count
            })
            
            return self
        
        except Exception as e:
            raise PreprocessingError(f"Failed to remove outliers: {str(e)}")
    
    def scale_numeric_features(self, method: str = "standard") -> "DataPreprocessor":
        """Scale numeric features"""
        try:
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
            
            if not numeric_cols:
                return self
            
            if method == "standard":
                scaler = StandardScaler()
            elif method == "minmax":
                scaler = MinMaxScaler()
            else:
                raise PreprocessingError(f"Unknown scaling method: {method}")
            
            self.df[numeric_cols] = scaler.fit_transform(self.df[numeric_cols])
            self.transformers['scaler'] = scaler
            
            self.preprocessing_steps.append({
                "step": "scale_numeric_features",
                "method": method,
                "columns": numeric_cols
            })
            
            return self
        
        except Exception as e:
            raise PreprocessingError(f"Failed to scale features: {str(e)}")
    
    def encode_categorical_features(self, method: str = "onehot", max_categories: int = 10) -> "DataPreprocessor":
        """Encode categorical features"""
        try:
            categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
            
            if not categorical_cols:
                return self
            
            if method == "label":
                encoders = {}
                for col in categorical_cols:
                    if self.df[col].nunique() > max_categories:
                        # Keep top categories, others as 'Other'
                        top_categories = self.df[col].value_counts().head(max_categories).index.tolist()
                        self.df[col] = self.df[col].apply(
                            lambda x: x if x in top_categories else 'Other'
                        )
                    
                    encoder = LabelEncoder()
                    self.df[col] = encoder.fit_transform(self.df[col].astype(str))
                    encoders[col] = encoder
                
                self.transformers['label_encoders'] = encoders
            
            elif method == "onehot":
                # One-hot encode with limited categories
                for col in categorical_cols:
                    if self.df[col].nunique() <= max_categories:
                        # Use pandas get_dummies for simplicity
                        dummies = pd.get_dummies(self.df[col], prefix=col, drop_first=True)
                        self.df = pd.concat([self.df.drop(col, axis=1), dummies], axis=1)
                    else:
                        # Keep top categories
                        top_categories = self.df[col].value_counts().head(max_categories).index.tolist()
                        self.df[col] = self.df[col].apply(
                            lambda x: x if x in top_categories else 'Other'
                        )
                        dummies = pd.get_dummies(self.df[col], prefix=col, drop_first=True)
                        self.df = pd.concat([self.df.drop(col, axis=1), dummies], axis=1)
            
            self.preprocessing_steps.append({
                "step": "encode_categorical_features",
                "method": method,
                "columns": categorical_cols,
                "new_shape": self.df.shape
            })
            
            return self
        
        except Exception as e:
            raise PreprocessingError(f"Failed to encode categorical features: {str(e)}")
    
    def drop_columns(self, columns: List[str]) -> "DataPreprocessor":
        """Drop specific columns"""
        try:
            columns_to_drop = [col for col in columns if col in self.df.columns]
            self.df = self.df.drop(columns=columns_to_drop)
            
            self.preprocessing_steps.append({
                "step": "drop_columns",
                "dropped_columns": columns_to_drop
            })
            
            return self
        
        except Exception as e:
            raise PreprocessingError(f"Failed to drop columns: {str(e)}")
    
    def get_preprocessed_data(self) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """Get preprocessed data and preprocessing steps"""
        return self.df, self.preprocessing_steps
    
    def get_summary(self) -> Dict[str, Any]:
        """Get preprocessing summary"""
        return {
            "original_shape": self.original_df.shape,
            "final_shape": self.df.shape,
            "rows_removed": len(self.original_df) - len(self.df),
            "columns_removed": len(self.original_df.columns) - len(self.df.columns),
            "preprocessing_steps": self.preprocessing_steps,
            "transformers_fit": list(self.transformers.keys())
        }
    
    @classmethod
    def auto_preprocess(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Automatically preprocess data with sensible defaults"""
        preprocessor = cls(df)
        
        # Apply preprocessing steps
        preprocessor\
            .handle_missing_values(numeric_strategy='mean', categorical_strategy='most_frequent')\
            .remove_duplicates()\
            .scale_numeric_features(method='standard')\
            .encode_categorical_features(method='label', max_categories=10)
        
        processed_df, steps = preprocessor.get_preprocessed_data()
        summary = preprocessor.get_summary()
        
        return processed_df, summary

# Helper function
def preprocess_data(df: pd.DataFrame, config: Dict[str, Any] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Convenience function to preprocess data"""
    if config is None:
        config = {}
    
    preprocessor = DataPreprocessor(df)
    
    # Apply steps based on config or defaults
    preprocessor.handle_missing_values(
        numeric_strategy=config.get('missing_numeric_strategy', 'mean'),
        categorical_strategy=config.get('missing_categorical_strategy', 'most_frequent')
    )
    
    preprocessor.remove_duplicates()
    
    if config.get('remove_outliers', False):
        preprocessor.remove_outliers(method=config.get('outlier_method', 'iqr'))
    
    preprocessor.scale_numeric_features(method=config.get('scaling_method', 'standard'))
    preprocessor.encode_categorical_features(method=config.get('encoding_method', 'label'))
    
    processed_df, steps = preprocessor.get_preprocessed_data()
    summary = preprocessor.get_summary()
    
    return processed_df, summary
