from enum import Enum
from typing import Dict, List, Any, Optional, Callable
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class PipelineStage(str, Enum):
    """Pipeline stages"""
    DATA_VALIDATION = "data_validation"
    DATA_CLEANING = "data_cleaning"
    FEATURE_ENGINEERING = "feature_engineering"
    FEATURE_SELECTION = "feature_selection"
    PREPROCESSING = "preprocessing"
    TRAIN_TEST_SPLIT = "train_test_split"
    MODEL_TRAINING = "model_training"
    MODEL_EVALUATION = "model_evaluation"
    HYPERPARAMETER_TUNING = "hyperparameter_tuning"
    ENSEMBLE = "ensemble"
    FINAL_EVALUATION = "final_evaluation"

class PipelineStageResult:
    """Result of a pipeline stage"""
    
    def __init__(self, stage: PipelineStage, success: bool, data: Dict[str, Any] = None, error: str = None):
        self.stage = stage
        self.success = success
        self.data = data or {}
        self.error = error
        self.timestamp = datetime.utcnow()

class MLPipeline:
    """ML Pipeline orchestration"""
    
    def __init__(self, name: str, stages: List[PipelineStage]):
        self.name = name
        self.stages = stages
        self.results: Dict[PipelineStage, PipelineStageResult] = {}
        self.start_time = None
        self.end_time = None
    
    def execute(self, data: Dict[str, Any], callbacks: Dict[PipelineStage, Callable] = None) -> bool:
        """Execute pipeline"""
        self.start_time = datetime.utcnow()
        callbacks = callbacks or {}
        
        logger.info(f"Starting pipeline: {self.name} with {len(self.stages)} stages")
        
        for stage in self.stages:
            try:
                callback = callbacks.get(stage)
                if callback:
                    result_data = callback(data)
                    success = result_data is not None
                else:
                    success = True
                    result_data = {}
                
                result = PipelineStageResult(
                    stage=stage,
                    success=success,
                    data=result_data if isinstance(result_data, dict) else {}
                )
                self.results[stage] = result
                
                if not success:
                    logger.error(f"Stage {stage.value} failed")
                    return False
                
                if isinstance(result_data, dict):
                    data.update(result_data)
            
            except Exception as e:
                logger.error(f"Stage {stage.value} failed with error: {str(e)}")
                self.results[stage] = PipelineStageResult(
                    stage=stage,
                    success=False,
                    error=str(e)
                )
                return False
        
        self.end_time = datetime.utcnow()
        return True
    
    def get_results(self) -> Dict[str, Any]:
        """Get pipeline results"""
        results_dict = {}
        for stage, result in self.results.items():
            results_dict[stage.value] = {
                "success": result.success,
                "error": result.error,
                "timestamp": result.timestamp.isoformat(),
                "data": result.data
            }
        
        return {
            "pipeline_name": self.name,
            "total_duration_seconds": self.get_duration(),
            "stages_completed": len([r for r in self.results.values() if r.success]),
            "stages_failed": len([r for r in self.results.values() if not r.success]),
            "results": results_dict
        }
    
    def get_duration(self) -> float:
        if not self.start_time or not self.end_time:
            return 0.0
        return (self.end_time - self.start_time).total_seconds()

class PipelineBuilder:
    """Builder for ML pipelines"""
    
    def __init__(self, name: str):
        self.name = name
        self.stages: List[PipelineStage] = []
    
    def add_stage(self, stage: PipelineStage) -> 'PipelineBuilder':
        self.stages.append(stage)
        return self
    
    def add_stages(self, stages: List[PipelineStage]) -> 'PipelineBuilder':
        self.stages.extend(stages)
        return self
    
    def build(self) -> MLPipeline:
        return MLPipeline(self.name, self.stages)

def create_classification_pipeline() -> MLPipeline:
    return PipelineBuilder("Classification Pipeline")\
        .add_stage(PipelineStage.DATA_VALIDATION)\
        .add_stage(PipelineStage.DATA_CLEANING)\
        .add_stage(PipelineStage.FEATURE_ENGINEERING)\
        .add_stage(PipelineStage.PREPROCESSING)\
        .add_stage(PipelineStage.TRAIN_TEST_SPLIT)\
        .add_stage(PipelineStage.MODEL_TRAINING)\
        .add_stage(PipelineStage.MODEL_EVALUATION)\
        .add_stage(PipelineStage.ENSEMBLE)\
        .add_stage(PipelineStage.FINAL_EVALUATION)\
        .build()

def create_regression_pipeline() -> MLPipeline:
    return PipelineBuilder("Regression Pipeline")\
        .add_stage(PipelineStage.DATA_VALIDATION)\
        .add_stage(PipelineStage.DATA_CLEANING)\
        .add_stage(PipelineStage.FEATURE_ENGINEERING)\
        .add_stage(PipelineStage.PREPROCESSING)\
        .add_stage(PipelineStage.TRAIN_TEST_SPLIT)\
        .add_stage(PipelineStage.MODEL_TRAINING)\
        .add_stage(PipelineStage.MODEL_EVALUATION)\
        .add_stage(PipelineStage.FINAL_EVALUATION)\
        .build()
