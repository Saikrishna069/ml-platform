import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
import warnings
from typing import Dict, Tuple, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

try:
    from statsmodels.tsa.stattools import adfuller, seasonal_decompose
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
except ImportError:
    logger.warning("statsmodels not installed. Install for ARIMA support.")

try:
    from prophet import Prophet
except ImportError:
    logger.warning("prophet not installed. Install for Prophet support.")

try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
except ImportError:
    logger.warning("tensorflow not installed. Install for LSTM support.")

class TimeSeriesAnalyzer:
    """Analyze time series data"""
    
    def __init__(self, data: pd.DataFrame, date_column: str, value_column: str):
        self.data = data.copy()
        self.date_column = date_column
        self.value_column = value_column
        
        self.data[date_column] = pd.to_datetime(self.data[date_column])
        self.data = self.data.sort_values(date_column)
        
        self.ts = self.data.set_index(date_column)[value_column]
    
    def detect_stationarity(self) -> Dict[str, Any]:
        """Test for stationarity using Augmented Dickey-Fuller test"""
        try:
            from statsmodels.tsa.stattools import adfuller
            result = adfuller(self.ts.dropna())
            
            return {
                "adf_statistic": float(result[0]),
                "p_value": float(result[1]),
                "is_stationary": bool(result[1] < 0.05),
                "critical_values": {
                    "1%": float(result[4]['1%']),
                    "5%": float(result[4]['5%']),
                    "10%": float(result[4]['10%'])
                }
            }
        except Exception as e:
            logger.error(f"Stationarity test failed: {str(e)}")
            return {"error": str(e)}
    
    def decompose_series(self, period: int = 12) -> Dict[str, Any]:
        """Decompose time series into trend, seasonality, and residual"""
        try:
            from statsmodels.tsa.seasonal import seasonal_decompose
            decomposition = seasonal_decompose(self.ts, model='additive', period=period)
            
            return {
                "trend": decomposition.trend.dropna().to_dict(),
                "seasonal": decomposition.seasonal.dropna().to_dict(),
                "residual": decomposition.resid.dropna().to_dict(),
                "period": period
            }
        except Exception as e:
            logger.error(f"Decomposition failed: {str(e)}")
            return {"error": str(e)}
    
    def get_acf_pacf(self, lags: int = 40) -> Dict[str, Any]:
        """Get ACF and PACF values"""
        try:
            from statsmodels.tsa.stattools import acf, pacf
            acf_vals = acf(self.ts.dropna(), nlags=lags)
            pacf_vals = pacf(self.ts.dropna(), nlags=lags)
            
            return {
                "acf": acf_vals.tolist(),
                "pacf": pacf_vals.tolist(),
                "lags": lags
            }
        except Exception as e:
            logger.error(f"ACF/PACF calculation failed: {str(e)}")
            return {"error": str(e)}
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """Get time series summary statistics"""
        return {
            "mean": float(self.ts.mean()),
            "std": float(self.ts.std()),
            "min": float(self.ts.min()),
            "max": float(self.ts.max()),
            "median": float(self.ts.median()),
            "count": int(len(self.ts)),
            "missing": int(self.ts.isna().sum())
        }

class ARIMAForecaster:
    """ARIMA forecasting model"""
    
    def __init__(self, ts: pd.Series, order: Tuple[int, int, int] = (1, 1, 1)):
        self.ts = ts
        self.order = order
        self.model = None
        self.results = None
    
    def fit(self) -> bool:
        """Fit ARIMA model"""
        try:
            from statsmodels.tsa.arima.model import ARIMA
            self.model = ARIMA(self.ts, order=self.order)
            self.results = self.model.fit()
            return True
        except Exception as e:
            logger.error(f"ARIMA fit failed: {str(e)}")
            return False
    
    def forecast(self, steps: int = 30) -> Dict[str, Any]:
        """Forecast future values"""
        if self.results is None:
            return {"error": "Model not fitted"}
        
        try:
            forecast = self.results.get_forecast(steps=steps)
            forecast_df = forecast.conf_int()
            forecast_df['forecast'] = forecast.predicted_mean
            
            return {
                "forecast": forecast_df['forecast'].to_dict(),
                "lower_ci": forecast_df.iloc[:, 0].to_dict(),
                "upper_ci": forecast_df.iloc[:, 1].to_dict(),
                "steps": steps
            }
        except Exception as e:
            logger.error(f"Forecasting failed: {str(e)}")
            return {"error": str(e)}
    
    def get_diagnostics(self) -> Dict[str, Any]:
        """Get model diagnostics"""
        if self.results is None:
            return {"error": "Model not fitted"}
        
        return {
            "aic": float(self.results.aic),
            "bic": float(self.results.bic),
            "parameters": {str(k): float(v) for k, v in self.results.params.to_dict().items()},
            "summary": str(self.results.summary())
        }

class LSTMForecaster:
    """LSTM neural network forecaster"""
    
    def __init__(self, ts: pd.Series, lookback: int = 12):
        self.ts = ts.values.reshape(-1, 1)
        self.lookback = lookback
        self.scaler = StandardScaler()
        self.model = None
    
    def prepare_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for LSTM"""
        scaled_data = self.scaler.fit_transform(self.ts)
        
        X, y = [], []
        for i in range(len(scaled_data) - self.lookback):
            X.append(scaled_data[i:i+self.lookback])
            y.append(scaled_data[i+self.lookback])
        
        return np.array(X), np.array(y)
    
    def fit(self, epochs: int = 20, batch_size: int = 32) -> bool:
        """Train LSTM model or fallback to linear trend model"""
        try:
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import LSTM, Dense, Dropout
            from tensorflow.keras.optimizers import Adam
            
            X, y = self.prepare_data()
            if len(X) == 0:
                return False
                
            self.model = Sequential([
                LSTM(50, activation='relu', input_shape=(self.lookback, 1), return_sequences=True),
                Dropout(0.2),
                LSTM(50, activation='relu'),
                Dropout(0.2),
                Dense(25, activation='relu'),
                Dense(1)
            ])
            self.model.compile(optimizer=Adam(learning_rate=0.001), loss='mse')
            self.model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0)
            return True
        except Exception as e:
            logger.error(f"LSTM fit failed, using linear trend fallback: {str(e)}")
            return False
    
    def forecast(self, steps: int = 30) -> Dict[str, Any]:
        """Forecast future values"""
        try:
            if self.model is not None:
                last_sequence = self.scaler.transform(self.ts[-self.lookback:].reshape(-1, 1))
                forecast = []
                
                for _ in range(steps):
                    next_pred = self.model.predict(last_sequence.reshape(1, self.lookback, 1), verbose=0)
                    forecast.append(next_pred[0, 0])
                    last_sequence = np.vstack([last_sequence[1:], next_pred])
                
                forecast_res = self.scaler.inverse_transform(np.array(forecast).reshape(-1, 1)).flatten()
                return {"forecast": forecast_res.tolist(), "steps": steps}
            else:
                # Linear trend fallback forecast
                y = self.ts.flatten()
                x = np.arange(len(y))
                slope, intercept = np.polyfit(x, y, 1)
                future_x = np.arange(len(y), len(y) + steps)
                forecast_res = slope * future_x + intercept
                return {"forecast": forecast_res.tolist(), "steps": steps, "fallback": True}
        except Exception as e:
            logger.error(f"LSTM forecasting failed: {str(e)}")
            return {"error": str(e)}

class TimeSeriesMetrics:
    """Calculate time series specific metrics"""
    
    @staticmethod
    def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        return float(mean_absolute_percentage_error(y_true, y_pred))
    
    @staticmethod
    def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        return float(np.sqrt(mean_squared_error(y_true, y_pred)))
    
    @staticmethod
    def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        return float(mean_absolute_error(y_true, y_pred))
    
    @staticmethod
    def theil_u(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        if ss_tot == 0:
            return 0.0
        return float(np.sqrt(ss_res / ss_tot))
