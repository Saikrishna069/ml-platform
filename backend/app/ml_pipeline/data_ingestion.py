import os
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any
import json

class DataIngestionError(Exception):
    """Custom exception for data ingestion errors"""
    pass

class DataIngester:
    """Handle data ingestion from various formats"""
    
    ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.json', '.parquet', '.hdf5']
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    
    def __init__(self, upload_dir: str = "./uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
    
    def save_uploaded_file(self, file_path: str, file_content: bytes) -> str:
        """Save uploaded file to disk"""
        try:
            full_path = os.path.join(self.upload_dir, file_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            with open(full_path, 'wb') as f:
                f.write(file_content)
            
            file_size = os.path.getsize(full_path)
            if file_size > self.MAX_FILE_SIZE:
                os.remove(full_path)
                raise DataIngestionError(
                    f"File size {file_size} exceeds maximum {self.MAX_FILE_SIZE}"
                )
            
            return full_path
        except Exception as e:
            raise DataIngestionError(f"Failed to save file: {str(e)}")
    
    def load_data(self, file_path: str) -> pd.DataFrame:
        """Load data from various formats"""
        try:
            file_ext = Path(file_path).suffix.lower()
            
            if file_ext == '.csv':
                df = pd.read_csv(file_path)
            elif file_ext in ['.xlsx', '.xls']:
                df = pd.read_excel(file_path)
            elif file_ext == '.json':
                df = pd.read_json(file_path)
            elif file_ext == '.parquet':
                df = pd.read_parquet(file_path)
            elif file_ext == '.hdf5' or file_ext == '.h5':
                df = pd.read_hdf(file_path)
            else:
                raise DataIngestionError(
                    f"Unsupported file format: {file_ext}"
                )
            
            if df.empty:
                raise DataIngestionError("Loaded data is empty")
            
            return df
        
        except DataIngestionError:
            raise
        except Exception as e:
            raise DataIngestionError(f"Failed to load data: {str(e)}")
    
    def validate_data(self, df: pd.DataFrame) -> Tuple[bool, str]:
        """Validate loaded data"""
        try:
            # Check if DataFrame is empty
            if df.empty:
                return False, "DataFrame is empty"
            
            # Check if DataFrame has at least 2 rows
            if len(df) < 2:
                return False, "DataFrame must have at least 2 rows"
            
            # Check if DataFrame has at least 2 columns
            if len(df.columns) < 2:
                return False, "DataFrame must have at least 2 columns"
            
            # Check for duplicate column names
            if df.columns.duplicated().any():
                return False, "DataFrame has duplicate column names"
            
            return True, "Data is valid"
        
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def get_dataset_info(self, df: pd.DataFrame, file_path: str) -> Dict[str, Any]:
        """Extract dataset information"""
        try:
            file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            
            info = {
                "n_rows": len(df),
                "n_columns": len(df.columns),
                "size_bytes": file_size,
                "columns": df.columns.tolist(),
                "dtypes": df.dtypes.astype(str).to_dict(),
                "memory_usage_mb": df.memory_usage(deep=True).sum() / 1024 / 1024,
                "missing_values": df.isnull().sum().to_dict(),
                "missing_percentage": (df.isnull().sum() / len(df) * 100).to_dict(),
                "duplicates": len(df) - len(df.drop_duplicates()),
                "head": df.head(5).to_dict(orient='records'),
            }
            
            return info
        
        except Exception as e:
            raise DataIngestionError(f"Failed to extract dataset info: {str(e)}")

# Create singleton instance
data_ingester = DataIngester()
