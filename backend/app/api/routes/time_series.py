from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.time_series import (
    TimeSeriesAnalyzer, ARIMAForecaster, LSTMForecaster, TimeSeriesMetrics
)
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd

router = APIRouter()

class TimeSeriesConfig(BaseModel):
    date_column: str
    value_column: str
    forecast_steps: int = 30
    model_type: str = "arima"  # arima, lstm

@router.post("/{dataset_id}/analyze")
async def analyze_time_series(
    dataset_id: int,
    config: TimeSeriesConfig,
    db: Session = Depends(get_db)
):
    """Analyze time series data"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = data_ingester.load_data(dataset.file_path)
        analyzer = TimeSeriesAnalyzer(df, config.date_column, config.value_column)
        
        analysis = {
            "summary_stats": analyzer.get_summary_stats(),
            "stationarity": analyzer.detect_stationarity(),
            "decomposition": analyzer.decompose_series(),
            "acf_pacf": analyzer.get_acf_pacf()
        }
        
        return {
            "dataset_id": dataset_id,
            "analysis": analysis
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{dataset_id}/forecast")
async def forecast_time_series(
    dataset_id: int,
    config: TimeSeriesConfig,
    db: Session = Depends(get_db)
):
    """Forecast time series"""
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = data_ingester.load_data(dataset.file_path)
        df[config.date_column] = pd.to_datetime(df[config.date_column])
        df = df.sort_values(config.date_column)
        
        ts = df.set_index(config.date_column)[config.value_column]
        
        if config.model_type == "arima":
            forecaster = ARIMAForecaster(ts)
            if not forecaster.fit():
                raise Exception("Failed to fit ARIMA model")
            forecast_result = forecaster.forecast(config.forecast_steps)
            diagnostics = forecaster.get_diagnostics()
        
        elif config.model_type == "lstm":
            forecaster = LSTMForecaster(ts)
            forecaster.fit(epochs=10)
            forecast_result = forecaster.forecast(config.forecast_steps)
            diagnostics = {}
        
        else:
            raise ValueError(f"Unknown model type: {config.model_type}")
        
        return {
            "dataset_id": dataset_id,
            "model_type": config.model_type,
            "forecast": forecast_result,
            "diagnostics": diagnostics
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/models")
async def get_time_series_models():
    """Get available time series models"""
    return {
        "models": [
            {
                "name": "ARIMA",
                "description": "AutoRegressive Integrated Moving Average",
                "params": {"p": "AR order", "d": "Differencing order", "q": "MA order"}
            },
            {
                "name": "LSTM",
                "description": "Long Short-Term Memory neural network",
                "params": {"lookback": "Past steps", "epochs": "Training epochs"}
            }
        ]
    }
