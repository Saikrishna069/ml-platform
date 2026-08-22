import time
import logging
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    mean_squared_error, r2_score, mean_absolute_error
)
import warnings

from app.ml_pipeline.automl_config import AutoMLConfig, AutoMLResults, TaskType
from app.ml_pipeline.feature_engineering import FeatureEngineer
from app.ml_pipeline.model_training import ModelTrainer

logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')

class AutoMLEngine:
    """Automated Machine Learning Engine"""
    
    def __init__(self, config: AutoMLConfig):
        self.config = config
        self.results = None
        self.start_time = None
        self.end_time = None
    
    def fit(self, X: pd.DataFrame, y: pd.Series) -> AutoMLResults:
        """Run AutoML pipeline"""
        self.start_time = time.time()
        logger.info(f"Starting AutoML for {self.config.task_type}")
        
        try:
            X_clean, y_clean = self._prepare_data(X, y)
            
            X_train_full, X_test, y_train_full, y_test = train_test_split(
                X_clean, y_clean,
                test_size=self.config.test_size,
                random_state=self.config.random_state
            )
            
            X_train, X_val, y_train, y_val = train_test_split(
                X_train_full, y_train_full,
                test_size=self.config.validation_size,
                random_state=self.config.random_state
            )
            
            X_train_fe, X_val_fe, X_test_fe, feature_pipeline = self._feature_engineering(
                X_train, X_val, X_test, y_train
            )
            
            X_train_prep, X_val_prep, X_test_prep, preprocess_pipeline = self._preprocessing(
                X_train_fe, X_val_fe, X_test_fe
            )
            
            models_scores = self._train_models(
                X_train_prep, X_val_prep, X_test_prep,
                y_train, y_val, y_test
            )
            
            if not models_scores:
                raise Exception("No models succeeded during training")
            
            if self.config.ensemble_enabled and len(models_scores) > 1:
                best_model, ensemble_info = self._create_ensemble(
                    X_train_prep, X_test_prep, y_train, y_test,
                    models_scores
                )
            else:
                best_model_name = max(models_scores, key=models_scores.get)
                best_model = self._train_final_model(best_model_name, X_train_prep, y_train)
                ensemble_info = None
            
            train_metrics = self._calculate_metrics(y_train, best_model.predict(X_train_prep))
            test_metrics = self._calculate_metrics(y_test, best_model.predict(X_test_prep))
            val_metrics = self._calculate_metrics(y_val, best_model.predict(X_val_prep))
            
            feature_names = X_train_fe.columns.tolist() if hasattr(X_train_fe, 'columns') else [f"f_{i}" for i in range(X_train_prep.shape[1])]
            feature_importance = self._get_feature_importance(best_model, feature_names)
            
            self.end_time = time.time()
            
            self.results = AutoMLResults(
                task_type=self.config.task_type,
                best_model=best_model,
                best_model_name=ensemble_info["name"] if ensemble_info else self._get_model_name(best_model),
                best_score=float(test_metrics.get("accuracy") or test_metrics.get("r2") or 0.0),
                train_metrics=train_metrics,
                test_metrics=test_metrics,
                validation_metrics=val_metrics,
                models_tried=list(models_scores.keys()),
                models_scores=models_scores,
                is_ensemble=ensemble_info is not None,
                ensemble_models=ensemble_info.get("models") if ensemble_info else None,
                ensemble_weights=ensemble_info.get("weights") if ensemble_info else None,
                feature_importance=feature_importance,
                selected_features=feature_names,
                total_time_seconds=self.end_time - self.start_time,
                total_iterations=len(models_scores),
                preprocessing_pipeline=preprocess_pipeline,
                feature_engineering_pipeline=feature_pipeline
            )
            
            return self.results
        
        except Exception as e:
            logger.error(f"AutoML pipeline failed: {str(e)}")
            raise
    
    def _prepare_data(self, X: pd.DataFrame, y: pd.Series) -> Tuple[pd.DataFrame, pd.Series]:
        if self.config.handle_missing:
            if self.config.missing_strategy == "mean":
                X = X.fillna(X.mean(numeric_only=True))
            elif self.config.missing_strategy == "median":
                X = X.fillna(X.median(numeric_only=True))
            elif self.config.missing_strategy == "drop":
                X = X.dropna()
                y = y[X.index]
        
        mask = ~X.duplicated()
        X = X[mask]
        y = y[mask]
        
        return X, y
    
    def _feature_engineering(
        self,
        X_train: pd.DataFrame,
        X_val: pd.DataFrame,
        X_test: pd.DataFrame,
        y_train: pd.Series
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Any]:
        if not self.config.enable_feature_engineering:
            return X_train, X_val, X_test, None
        
        try:
            engineer = FeatureEngineer()
            strategies = ['statistical_features']
            if self.config.polynomial_features:
                strategies.append('polynomial')
            
            X_train_fe, fe_pipeline = engineer.engineer_features(
                X_train, y_train, strategies=strategies
            )
            
            X_val_fe = X_val.reindex(columns=X_train_fe.columns, fill_value=0)
            X_test_fe = X_test.reindex(columns=X_train_fe.columns, fill_value=0)
            
            return X_train_fe, X_val_fe, X_test_fe, fe_pipeline
        except Exception as e:
            logger.warning(f"Feature engineering fallback: {str(e)}")
            return X_train, X_val, X_test, None
    
    def _preprocessing(
        self,
        X_train: pd.DataFrame,
        X_val: pd.DataFrame,
        X_test: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Any]:
        if not self.config.scale_features:
            return X_train.values, X_val.values, X_test.values, None
        
        try:
            scaler = StandardScaler() if self.config.scaling_method == "standard" else RobustScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_val_scaled = scaler.transform(X_val)
            X_test_scaled = scaler.transform(X_test)
            return X_train_scaled, X_val_scaled, X_test_scaled, scaler
        except Exception as e:
            logger.warning(f"Preprocessing fallback: {str(e)}")
            return X_train.values, X_val.values, X_test.values, None
    
    def _train_models(
        self,
        X_train: np.ndarray,
        X_val: np.ndarray,
        X_test: np.ndarray,
        y_train: pd.Series,
        y_val: pd.Series,
        y_test: pd.Series
    ) -> Dict[str, float]:
        models_scores = {}
        is_classif = "classification" in self.config.task_type.value
        trainer = ModelTrainer(X_train, y_train, task_type="classification" if is_classif else "regression")
        
        available_models = trainer.CLASSIFICATION_MODELS if is_classif else trainer.REGRESSION_MODELS
        
        for model_name in self.config.models_to_try:
            if model_name not in available_models:
                continue
            try:
                model_cls = available_models[model_name]
                model = model_cls()
                model.fit(X_train, y_train)
                y_pred = model.predict(X_val)
                
                score = float(accuracy_score(y_val, y_pred) if is_classif else r2_score(y_val, y_pred))
                models_scores[model_name] = score
            except Exception as e:
                logger.warning(f"Failed to train {model_name}: {str(e)}")
        
        return models_scores
    
    def _train_final_model(self, model_name: str, X_train: np.ndarray, y_train: pd.Series) -> Any:
        is_classif = "classification" in self.config.task_type.value
        trainer = ModelTrainer(X_train, y_train, task_type="classification" if is_classif else "regression")
        models_dict = trainer.CLASSIFICATION_MODELS if is_classif else trainer.REGRESSION_MODELS
        model = models_dict[model_name]()
        model.fit(X_train, y_train)
        return model
    
    def _create_ensemble(
        self,
        X_train: np.ndarray,
        X_test: np.ndarray,
        y_train: pd.Series,
        y_test: pd.Series,
        models_scores: Dict[str, float]
    ) -> Tuple[Any, Dict[str, Any]]:
        try:
            from sklearn.ensemble import VotingClassifier, VotingRegressor
            
            top_models = sorted(models_scores.items(), key=lambda x: x[1], reverse=True)[:self.config.ensemble_size]
            top_names = [m[0] for m in top_models]
            weights = [m[1] for m in top_models]
            tot = sum(weights) or 1
            weights = [w / tot for w in weights]
            
            estimators = []
            for name in top_names:
                m = self._train_final_model(name, X_train, y_train)
                estimators.append((name, m))
            
            if "classification" in self.config.task_type.value:
                ensemble = VotingClassifier(estimators=estimators, voting='soft', weights=weights)
            else:
                ensemble = VotingRegressor(estimators=estimators, weights=weights)
            
            ensemble.fit(X_train, y_train)
            return ensemble, {"name": f"Ensemble_{len(top_names)}", "models": top_names, "weights": weights}
        
        except Exception as e:
            logger.warning(f"Ensemble creation fallback: {str(e)}")
            best_name = max(models_scores, key=models_scores.get)
            model = self._train_final_model(best_name, X_train, y_train)
            return model, None
    
    def _calculate_metrics(self, y_true: pd.Series, y_pred: np.ndarray) -> Dict[str, float]:
        if "classification" in self.config.task_type.value:
            metrics = {
                "accuracy": float(accuracy_score(y_true, y_pred)),
                "f1": float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
            }
        else:
            metrics = {
                "r2": float(r2_score(y_true, y_pred)),
                "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
                "mae": float(mean_absolute_error(y_true, y_pred))
            }
        return metrics
    
    def _get_feature_importance(self, model: Any, feature_names: List[str]) -> Dict[str, float]:
        try:
            if hasattr(model, 'feature_importances_'):
                imp = model.feature_importances_
            elif hasattr(model, 'coef_'):
                imp = np.abs(model.coef_[0] if len(model.coef_.shape) > 1 else model.coef_)
            else:
                return {}
            
            res = dict(zip(feature_names, [float(v) for v in imp]))
            return dict(sorted(res.items(), key=lambda x: x[1], reverse=True)[:20])
        except Exception:
            return {}
    
    def _get_model_name(self, model: Any) -> str:
        return model.__class__.__name__
