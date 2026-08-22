from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.db.marketplace_models import PublishedModel, ModelReview
from app.api.dependencies import get_current_user
from app.services.model_publishing import ModelPublisher
from pydantic import BaseModel
from typing import List, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class PublishModelRequest(BaseModel):
    name: str
    description: str
    category: str = "classification"
    tags: Optional[List[str]] = None
    model_type: str = "RandomForest"
    framework: str = "scikit-learn"
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    training_samples: Optional[int] = None
    price_per_inference: float = 0.0
    price_one_time: Optional[float] = None
    documentation_url: Optional[str] = None
    github_url: Optional[str] = None

class AddReviewRequest(BaseModel):
    rating: int
    title: str
    review_text: str

@router.post("/models/publish")
async def publish_model(
    request: PublishModelRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish model to marketplace"""
    try:
        model_data = {
            "category": request.category,
            "model_type": request.model_type,
            "framework": request.framework,
            "url": f"s3://models/{request.name.lower().replace(' ', '_')}.pkl",
            "size_mb": 1.5,
            "features": [],
            "output_type": request.category
        }
        
        metrics = {
            "accuracy": request.accuracy or 0.85,
            "f1": request.f1_score or 0.82
        }
        
        published_model = ModelPublisher.publish_model(
            db,
            current_user.id,
            request.name,
            request.description,
            model_data,
            metrics,
            request.tags,
            request.price_per_inference
        )
        
        if not published_model:
            raise HTTPException(status_code=500, detail="Failed to publish model")
        
        return {
            "model_id": published_model.id,
            "slug": published_model.slug,
            "name": published_model.name,
            "status": "published",
            "marketplace_url": f"/marketplace/models/{published_model.slug}"
        }
    except Exception as e:
        logger.error(f"Model publishing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/models/search")
async def search_models(
    query: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[str] = None,
    min_rating: float = Query(0.0, ge=0, le=5),
    sort_by: str = Query("relevance"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Search published models"""
    tag_list = tags.split(",") if tags else None
    models_list = ModelPublisher.search_models(
        db, query=query, category=category, tags=tag_list,
        min_rating=min_rating, sort_by=sort_by, limit=limit, offset=offset
    )
    
    return {
        "total": len(models_list),
        "models": [
            {
                "id": m.id,
                "slug": m.slug,
                "name": m.name,
                "description": (m.description or "")[:200],
                "category": m.category,
                "framework": m.framework,
                "accuracy": m.accuracy,
                "rating": m.average_rating,
                "review_count": m.review_count,
                "download_count": m.download_count,
                "price_per_inference": m.price_per_inference,
                "price_one_time": m.price_one_time,
                "tags": m.tags or []
            }
            for m in models_list
        ]
    }

@router.get("/models/trending")
async def get_trending_models(
    days: int = Query(7, ge=1, le=30),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get trending models"""
    models_list = ModelPublisher.get_trending_models(db, days=days, limit=limit)
    return {
        "period_days": days,
        "models": [
            {
                "id": m.id,
                "slug": m.slug,
                "name": m.name,
                "rating": m.average_rating,
                "downloads": m.download_count,
                "category": m.category
            }
            for m in models_list
        ]
    }

@router.get("/models/{model_slug}")
async def get_model_details(
    model_slug: str,
    db: Session = Depends(get_db)
):
    """Get model details"""
    model = db.query(PublishedModel).filter(PublishedModel.slug == model_slug).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    model.view_count += 1
    db.commit()
    
    reviews = db.query(ModelReview).filter(ModelReview.model_id == model.id).all()
    
    return {
        "id": model.id,
        "name": model.name,
        "description": model.description,
        "category": model.category,
        "tags": model.tags,
        "model_type": model.model_type,
        "framework": model.framework,
        "version": model.version,
        "metrics": {
            "accuracy": model.accuracy,
            "f1_score": model.f1_score,
            "auc": model.auc_score,
            "r2": model.r2_score
        },
        "features": model.input_features,
        "training_samples": model.training_samples,
        "rating": model.average_rating,
        "review_count": model.review_count,
        "download_count": model.download_count,
        "view_count": model.view_count,
        "price_per_inference": model.price_per_inference,
        "price_one_time": model.price_one_time,
        "license": model.license,
        "published_at": model.published_at.isoformat() if model.published_at else None,
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "title": r.title,
                "text": r.review_text,
                "helpful": r.helpful_count,
                "created_at": r.created_at.isoformat()
            }
            for r in reviews
        ]
    }

@router.post("/models/{model_id}/review")
async def add_model_review(
    model_id: int,
    request: AddReviewRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add review to model"""
    review = ModelPublisher.add_review(
        db, model_id, current_user.id, request.rating, request.title, request.review_text
    )
    if not review:
        raise HTTPException(status_code=500, detail="Failed to add review")
    
    return {
        "review_id": review.id,
        "rating": review.rating,
        "created_at": review.created_at.isoformat()
    }

@router.post("/models/{model_id}/download")
async def download_model(
    model_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record model download"""
    success = ModelPublisher.record_usage(
        db, model_id, current_user.id, current_user.organization_id, inferences=1
    )
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Download recorded"}

@router.post("/models/{model_id}/purchase")
async def purchase_model(
    model_id: int,
    duration_days: int = Query(365, ge=30, le=3650),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purchase model"""
    purchase = ModelPublisher.purchase_model(
        db, model_id, current_user.id, current_user.organization_id, duration_days
    )
    if not purchase:
        raise HTTPException(status_code=400, detail="Model not available for purchase")
    
    return {
        "purchase_id": purchase.id,
        "license_key": purchase.license_key,
        "price": purchase.price,
        "activated_at": purchase.activated_at.isoformat() if purchase.activated_at else None,
        "expires_at": purchase.expires_at.isoformat() if purchase.expires_at else None
    }

@router.get("/earnings")
async def get_earnings(
    month: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get creator earnings"""
    return ModelPublisher.get_creator_earnings(db, current_user.id, month)

@router.get("/my-models")
async def get_my_models(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's published models"""
    models_list = db.query(PublishedModel).filter(PublishedModel.creator_id == current_user.id).all()
    return {
        "total": len(models_list),
        "models": [
            {
                "id": m.id,
                "slug": m.slug,
                "name": m.name,
                "status": "published" if m.is_published else "draft",
                "rating": m.average_rating,
                "downloads": m.download_count,
                "published_at": m.published_at.isoformat() if m.published_at else None
            }
            for m in models_list
        ]
    }
