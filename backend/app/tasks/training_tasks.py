import os
from celery import shared_task
from celery.utils.log import get_task_logger
from app.db.database import SessionLocal
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester
from app.ml_pipeline.preprocessing import DataPreprocessor
from app.ml_pipeline.model_training import ModelTrainer
from app.ml_pipeline.model_selector import recommend_models
import json
from datetime import datetime

logger = get_task_logger(__name__)

@shared_task(bind=True, name='train_models')
def train_models_async(self, experiment_id: int, dataset_id: int, 
                       target_column: str, task_type: str = 'classification',
                       model_names: list = None):
    """Train models asynchronously"""
    
    db = SessionLocal()
    
    try:
        experiment = db.query(models.Experiment).filter(
            models.Experiment.id == experiment_id
        ).first()
        
        if not experiment:
            raise Exception(f"Experiment {experiment_id} not found")
        
        experiment.status = "running"
        experiment.started_at = datetime.utcnow()
        db.commit()
        
        self.update_state(state='PROGRESS', meta={'current': 0, 'total': len(model_names or [])})
        
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise Exception(f"Dataset {dataset_id} not found")
        
        df = data_ingester.load_data(dataset.file_path)
        
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        preprocessor = DataPreprocessor(X)
        preprocessor\
            .handle_missing_values()\
            .remove_duplicates()\
            .scale_numeric_features()\
            .encode_categorical_features()
        X_processed, _ = preprocessor.get_preprocessed_data()
        
        trainer = ModelTrainer(X_processed, y, task_type=task_type)
        results = trainer.train_multiple_models(
            model_names=model_names or list(trainer.CLASSIFICATION_MODELS.keys()),
            test_size=0.2
        )
        
        for idx, result in enumerate(results):
            if 'error' in result:
                logger.warning(f"Failed to train {result['model_name']}: {result['error']}")
                continue
            
            model_run = models.ModelRun(
                experiment_id=experiment_id,
                model_name=result['model_name'],
                hyperparameters={},
                metrics=result['metrics'],
                training_time_seconds=result['training_time_seconds'],
                status='completed'
            )
            db.add(model_run)
            
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': idx + 1,
                    'total': len(results),
                    'current_model': result['model_name']
                }
            )
        
        experiment.status = "completed"
        experiment.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Training completed for experiment {experiment_id}")
        
        return {
            'experiment_id': experiment_id,
            'status': 'completed',
            'total_models': len(results),
            'successful_models': len([r for r in results if 'error' not in r])
        }
    
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        experiment = db.query(models.Experiment).filter(
            models.Experiment.id == experiment_id
        ).first()
        
        if experiment:
            experiment.status = "failed"
            experiment.completed_at = datetime.utcnow()
            db.commit()
        
        raise
    
    finally:
        db.close()

@shared_task(bind=True, name='preprocess_dataset')
def preprocess_dataset_async(self, dataset_id: int, config: dict):
    """Preprocess dataset asynchronously"""
    
    db = SessionLocal()
    
    try:
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == dataset_id
        ).first()
        
        if not dataset:
            raise Exception(f"Dataset {dataset_id} not found")
        
        df = data_ingester.load_data(dataset.file_path)
        
        preprocessor = DataPreprocessor(df)
        preprocessor\
            .handle_missing_values(
                numeric_strategy=config.get('missing_numeric_strategy', 'mean'),
                categorical_strategy=config.get('missing_categorical_strategy', 'most_frequent')
            )\
            .remove_duplicates()
        
        if config.get('remove_outliers', False):
            preprocessor.remove_outliers(method=config.get('outlier_method', 'iqr'))
        
        preprocessor\
            .scale_numeric_features(method=config.get('scaling_method', 'standard'))\
            .encode_categorical_features(method=config.get('encoding_method', 'label'))
        
        processed_df, _ = preprocessor.get_preprocessed_data()
        preprocessed_path = dataset.file_path.replace('.csv', '_preprocessed.csv')
        processed_df.to_csv(preprocessed_path, index=False)
        
        logger.info(f"Preprocessing completed for dataset {dataset_id}")
        
        return {
            'dataset_id': dataset_id,
            'status': 'completed',
            'preprocessed_path': preprocessed_path
        }
    
    except Exception as e:
        logger.error(f"Preprocessing failed: {str(e)}")
        raise
    
    finally:
        db.close()

@shared_task(bind=True, name='tune_hyperparameters')
def tune_hyperparameters_async(self, experiment_id: int, model_name: str, config: dict):
    """Tune hyperparameters asynchronously"""
    
    db = SessionLocal()
    
    try:
        experiment = db.query(models.Experiment).filter(
            models.Experiment.id == experiment_id
        ).first()
        
        if not experiment:
            raise Exception(f"Experiment {experiment_id} not found")
        
        dataset = db.query(models.Dataset).filter(
            models.Dataset.id == experiment.dataset_id
        ).first()
        
        df = data_ingester.load_data(dataset.file_path)
        
        X = df.drop(columns=[config['target_column']])
        y = df[config['target_column']]
        
        preprocessor = DataPreprocessor(X)
        preprocessor\
            .handle_missing_values()\
            .remove_duplicates()\
            .scale_numeric_features()\
            .encode_categorical_features()
        X_processed, _ = preprocessor.get_preprocessed_data()
        
        trainer = ModelTrainer(X_processed, y, task_type=config.get('task_type', 'classification'))
        
        if config.get('task_type') == 'classification':
            if model_name not in trainer.CLASSIFICATION_MODELS:
                raise Exception(f"Model {model_name} not found")
            base_model = trainer.CLASSIFICATION_MODELS[model_name]
        else:
            if model_name not in trainer.REGRESSION_MODELS:
                raise Exception(f"Model {model_name} not found")
            base_model = trainer.REGRESSION_MODELS[model_name]
        
        from app.ml_pipeline.hyperparameter_tuning import HyperparameterTuner
        
        X_train, X_test, y_train, y_test = trainer.split_data()
        tuner = HyperparameterTuner(base_model, X_train, y_train, task_type=config.get('task_type'))
        best_model, best_params, tuning_time = tuner.random_search_tune(model_name, n_iter=15)
        
        y_pred = best_model.predict(X_test)
        
        from sklearn.metrics import accuracy_score, f1_score
        metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'f1': float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
        }
        
        logger.info(f"Tuning completed for {model_name} in experiment {experiment_id}")
        
        return {
            'experiment_id': experiment_id,
            'model_name': model_name,
            'best_params': best_params,
            'metrics': metrics,
            'tuning_time_seconds': tuning_time
        }
    
    except Exception as e:
        logger.error(f"Tuning failed: {str(e)}")
        raise
    
    finally:
        db.close()
