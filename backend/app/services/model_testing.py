from typing import Dict, Any, List, Optional
import logging
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class ModelTestSuite:
    """Comprehensive model testing suite"""
    
    @staticmethod
    def run_unit_tests(model: Any, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """Run unit tests"""
        try:
            results = {
                "test_type": "unit",
                "all_passed": True,
                "tests": [],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Test 1: Predict capability
            try:
                predictions = model.predict(X_test)
                results["tests"].append({
                    "name": "can_predict",
                    "passed": True,
                    "message": f"Model predicted {len(predictions)} samples"
                })
            except Exception as e:
                results["tests"].append({
                    "name": "can_predict",
                    "passed": False,
                    "error": str(e)
                })
                results["all_passed"] = False
            
            # Test 2: Output shape
            try:
                predictions = model.predict(X_test)
                if len(predictions) == len(X_test):
                    results["tests"].append({
                        "name": "output_shape",
                        "passed": True,
                        "message": f"Output length {len(predictions)} matches input"
                    })
                else:
                    raise ValueError(f"Output shape mismatch: got {len(predictions)}, expected {len(X_test)}")
            except Exception as e:
                results["tests"].append({
                    "name": "output_shape",
                    "passed": False,
                    "error": str(e)
                })
                results["all_passed"] = False
            
            # Test 3: Non-null values
            try:
                predictions = model.predict(X_test)
                if not np.isnan(predictions).any():
                    results["tests"].append({
                        "name": "no_nan_predictions",
                        "passed": True,
                        "message": "No NaN values in predictions"
                    })
                else:
                    raise ValueError("NaN values found in predictions")
            except Exception as e:
                results["tests"].append({
                    "name": "no_nan_predictions",
                    "passed": False,
                    "error": str(e)
                })
                results["all_passed"] = False
            
            return results
        
        except Exception as e:
            logger.error(f"Unit tests failed: {str(e)}")
            return {"all_passed": False, "error": str(e)}
    
    @staticmethod
    def run_performance_tests(
        model: Any,
        X_test: np.ndarray,
        latency_threshold_ms: float = 100.0
    ) -> Dict[str, Any]:
        """Run performance tests"""
        try:
            results = {
                "test_type": "performance",
                "all_passed": True,
                "tests": [],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            start = time.time()
            predictions = model.predict(X_test)
            elapsed_ms = (time.time() - start) * 1000
            per_sample_ms = elapsed_ms / max(len(X_test), 1)
            
            if per_sample_ms <= latency_threshold_ms:
                results["tests"].append({
                    "name": "inference_latency",
                    "passed": True,
                    "latency_ms": per_sample_ms,
                    "threshold_ms": latency_threshold_ms
                })
            else:
                results["tests"].append({
                    "name": "inference_latency",
                    "passed": False,
                    "latency_ms": per_sample_ms,
                    "threshold_ms": latency_threshold_ms,
                    "error": f"Latency {per_sample_ms:.2f}ms exceeds {latency_threshold_ms}ms"
                })
                results["all_passed"] = False
            
            return results
        
        except Exception as e:
            logger.error(f"Performance tests failed: {str(e)}")
            return {"all_passed": False, "error": str(e)}
    
    @staticmethod
    def run_all_tests(
        model: Any,
        X_test: np.ndarray,
        y_test: np.ndarray,
        baseline_metrics: Dict[str, float] = None,
        latency_threshold_ms: float = 100.0
    ) -> Dict[str, Any]:
        """Run all model test suites"""
        unit = ModelTestSuite.run_unit_tests(model, X_test, y_test)
        perf = ModelTestSuite.run_performance_tests(model, X_test, latency_threshold_ms)
        
        all_passed = unit.get("all_passed", False) and perf.get("all_passed", False)
        
        return {
            "all_passed": all_passed,
            "unit": unit,
            "performance": perf,
            "timestamp": datetime.utcnow().isoformat()
        }
