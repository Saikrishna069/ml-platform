from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.ml_pipeline.data_ingestion import data_ingester, DataIngestionError
from app.ml_pipeline.model_selector import recommend_models

router = APIRouter()

@router.get("/")
async def list_available_models():
    """List all available ML models"""
    
    models_dict = {
        "classic_ml": [
            "LinearRegression",
            "Ridge",
            "Lasso",
            "LogisticRegression",
            "KNN",
            "SVM",
            "RandomForest",
            "DecisionTree",
        ],
        "ensemble": [
            "GradientBoosting",
            "XGBoost",
            "LightGBM",
            "CatBoost",
            "AdaBoost",
            "VotingClassifier",
        ],
        "deep_learning": [
            "MLP",
            "CNN",
            "RNN",
            "LSTM",
        ]
    }
    
    return models_dict

@router.post("/recommend")
async def recommend_dataset_models(
    dataset_id: int = Query(...),
    target_column: str = Query(None),
    top_n: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """Get recommended models for a dataset"""
    
    dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Load data
        df = data_ingester.load_data(dataset.file_path)
        
        # Get recommendations
        recommendations = recommend_models(df, target_column=target_column, top_n=top_n)
        
        return {
            "dataset_id": dataset_id,
            "recommendations": recommendations
        }
    
    except DataIngestionError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recommending models: {str(e)}")

@router.get("/{model_name}/info")
async def get_model_info(model_name: str):
    """Get detailed information about a specific model"""
    
    model_info = {
        "LogisticRegression": {
            "category": "classic_ml",
            "description": "Linear model for binary and multiclass classification",
            "pros": ["Fast training", "Interpretable", "Works well with small data"],
            "cons": ["Limited non-linear patterns", "May underfit complex data"],
            "parameters": ["C", "penalty", "solver", "max_iter"],
            "time_complexity": "O(n_samples * n_features)"
        },
        "RandomForest": {
            "category": "ensemble",
            "description": "Ensemble of decision trees for classification and regression",
            "pros": ["Robust", "Good with non-linear data", "Feature importance"],
            "cons": ["Slower predictions", "Memory intensive"],
            "parameters": ["n_estimators", "max_depth", "min_samples_split"],
            "time_complexity": "O(n_samples * log(n_samples) * n_features)"
        },
        "XGBoost": {
            "category": "ensemble",
            "description": "Gradient boosting framework with high performance",
            "pros": ["State-of-the-art", "Fast training", "Handles imbalance"],
            "cons": ["Requires tuning", "Memory intensive"],
            "parameters": ["learning_rate", "max_depth", "n_estimators", "subsample"],
            "time_complexity": "O(n_samples * n_features * log(n_samples))"
        },
        "LightGBM": {
            "category": "ensemble",
            "description": "Fast gradient boosting framework optimized for speed",
            "pros": ["Very fast", "Memory efficient", "Good for large data"],
            "cons": ["Can overfit", "Requires careful tuning"],
            "parameters": ["learning_rate", "num_leaves", "n_estimators"],
            "time_complexity": "O(n_samples * n_features)"
        },
        "SVM": {
            "category": "classic_ml",
            "description": "Support Vector Machine for classification and regression",
            "pros": ["Works well with high dimensions", "Good with small data"],
            "cons": ["Slow on large data", "Requires scaling"],
            "parameters": ["C", "kernel", "gamma"],
            "time_complexity": "O(n_samples^2 * n_features)"
        },
        "KNN": {
            "category": "classic_ml",
            "description": "K-Nearest Neighbors for classification and regression",
            "pros": ["Simple", "No training phase", "Flexible"],
            "cons": ["Slow predictions", "Sensitive to features scale"],
            "parameters": ["n_neighbors", "weights", "metric"],
            "time_complexity": "O(n_samples * n_features)"
        },
    }
    
    if model_name not in model_info:
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
    
    return model_info[model_name]

