from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

class TaskType(str, Enum):
    """Machine learning task types"""
    BINARY_CLASSIFICATION = "binary_classification"
    MULTICLASS_CLASSIFICATION = "multiclass_classification"
    REGRESSION = "regression"
    TIME_SERIES = "time_series"

class SearchStrategy(str, Enum):
    """Hyperparameter search strategies"""
    RANDOM = "random"
    GRID = "grid"
    BAYESIAN = "bayesian"
    HYPERBAND = "hyperband"

@dataclass
class AutoMLConfig:
    """AutoML configuration"""
    
    task_type: TaskType
    target_column: str
    test_size: float = 0.2
    validation_size: float = 0.2
    random_state: int = 42
    
    total_time_budget_minutes: int = 60
    per_model_time_minutes: int = 10
    
    enable_feature_engineering: bool = True
    max_features: Optional[int] = None
    polynomial_features: bool = False
    interaction_features: bool = False
    
    models_to_try: List[str] = field(default_factory=lambda: [
        "LogisticRegression",
        "RandomForest",
        "GradientBoosting"
    ])
    
    ensemble_enabled: bool = True
    ensemble_size: int = 3
    
    hyperparameter_tuning: bool = True
    search_strategy: SearchStrategy = SearchStrategy.RANDOM
    n_trials: int = 10
    
    handle_missing: bool = True
    missing_strategy: str = "mean"
    scale_features: bool = True
    scaling_method: str = "standard"
    outlier_removal: bool = False
    
    explain_predictions: bool = True
    save_artifacts: bool = True
    
    n_jobs: int = -1
    verbose: int = 1

@dataclass
class AutoMLResults:
    """AutoML results"""
    
    task_type: TaskType
    best_model: Any
    best_model_name: str
    best_score: float
    
    train_metrics: Dict[str, float]
    test_metrics: Dict[str, float]
    validation_metrics: Dict[str, float]
    
    models_tried: List[str]
    models_scores: Dict[str, float]
    
    is_ensemble: bool = False
    ensemble_models: Optional[List[str]] = None
    ensemble_weights: Optional[List[float]] = None
    
    feature_importance: Dict[str, float] = field(default_factory=dict)
    selected_features: List[str] = field(default_factory=list)
    
    total_time_seconds: float = 0.0
    total_iterations: int = 0
    
    preprocessing_pipeline: Optional[Any] = None
    feature_engineering_pipeline: Optional[Any] = None
