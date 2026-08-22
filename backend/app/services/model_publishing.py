from sqlalchemy.orm import Session
from app.db.marketplace_models import (
    PublishedModel, MarketplaceModelVersion as ModelVersion, ModelReview, ModelUsageRecord,
    ModelPurchase, ModelCollection
)
from app.db import models
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

class ModelPublisher:
    """Manage model publishing and marketplace"""
    
    @staticmethod
    def publish_model(
        db: Session,
        creator_id: int,
        name: str,
        description: str,
        model_data: Dict[str, Any],
        metrics: Dict[str, float],
        tags: List[str] = None,
        price: float = 0.0
    ) -> Optional[PublishedModel]:
        try:
            slug = f"{name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:8]}"
            
            published_model = PublishedModel(
                creator_id=creator_id,
                name=name,
                slug=slug,
                description=description,
                category=model_data.get("category", "other"),
                tags=tags or [],
                model_type=model_data.get("model_type"),
                framework=model_data.get("framework"),
                version="1.0.0",
                accuracy=metrics.get("accuracy"),
                f1_score=metrics.get("f1"),
                auc_score=metrics.get("auc"),
                rmse=metrics.get("rmse"),
                r2_score=metrics.get("r2"),
                input_features=model_data.get("features", []),
                output_type=model_data.get("output_type"),
                training_samples=model_data.get("training_samples"),
                feature_count=len(model_data.get("features", [])),
                price_per_inference=price,
                model_url=model_data.get("url"),
                model_size_mb=model_data.get("size_mb", 0.0),
                is_published=True,
                published_at=datetime.utcnow()
            )
            
            db.add(published_model)
            db.commit()
            db.refresh(published_model)
            return published_model
        
        except Exception as e:
            logger.error(f"Model publishing failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def search_models(
        db: Session,
        query: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        min_rating: float = 0.0,
        sort_by: str = "relevance",
        limit: int = 20,
        offset: int = 0
    ) -> List[PublishedModel]:
        try:
            base_query = db.query(PublishedModel).filter(PublishedModel.is_published == True)
            
            if query:
                search_term = f"%{query}%"
                base_query = base_query.filter(
                    (PublishedModel.name.ilike(search_term)) |
                    (PublishedModel.description.ilike(search_term))
                )
            
            if category:
                base_query = base_query.filter(PublishedModel.category == category)
            
            if min_rating > 0:
                base_query = base_query.filter(PublishedModel.average_rating >= min_rating)
            
            if sort_by == "rating":
                base_query = base_query.order_by(PublishedModel.average_rating.desc())
            elif sort_by == "popularity":
                base_query = base_query.order_by(PublishedModel.download_count.desc())
            elif sort_by == "recent":
                base_query = base_query.order_by(PublishedModel.published_at.desc())
            else:
                base_query = base_query.order_by(PublishedModel.view_count.desc())
            
            return base_query.limit(limit).offset(offset).all()
        
        except Exception as e:
            logger.error(f"Model search failed: {str(e)}")
            return []
    
    @staticmethod
    def add_review(
        db: Session,
        model_id: int,
        reviewer_id: int,
        rating: int,
        title: str,
        review_text: str
    ) -> Optional[ModelReview]:
        try:
            if rating < 1 or rating > 5:
                raise ValueError("Rating must be between 1 and 5")
            
            review = ModelReview(
                model_id=model_id,
                reviewer_id=reviewer_id,
                rating=rating,
                title=title,
                review_text=review_text
            )
            db.add(review)
            
            model = db.query(PublishedModel).filter(PublishedModel.id == model_id).first()
            if model:
                reviews = db.query(ModelReview).filter(ModelReview.model_id == model_id).all()
                all_ratings = [r.rating for r in reviews] + [rating]
                model.average_rating = sum(all_ratings) / len(all_ratings)
                model.review_count = len(all_ratings)
            
            db.commit()
            db.refresh(review)
            return review
        
        except Exception as e:
            logger.error(f"Review addition failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def record_usage(
        db: Session,
        model_id: int,
        user_id: int,
        organization_id: Optional[int] = None,
        inferences: int = 1
    ) -> bool:
        try:
            month = datetime.utcnow().strftime("%Y-%m")
            model = db.query(PublishedModel).filter(PublishedModel.id == model_id).first()
            if not model:
                return False
            
            cost = inferences * (model.price_per_inference or 0.0)
            
            usage_record = db.query(ModelUsageRecord).filter(
                ModelUsageRecord.model_id == model_id,
                ModelUsageRecord.user_id == user_id,
                ModelUsageRecord.month == month
            ).first()
            
            if usage_record:
                usage_record.inference_count += inferences
                usage_record.total_cost += cost
            else:
                usage_record = ModelUsageRecord(
                    model_id=model_id,
                    user_id=user_id,
                    organization_id=organization_id,
                    month=month,
                    inference_count=inferences,
                    total_cost=cost
                )
                db.add(usage_record)
            
            model.download_count += inferences
            db.commit()
            return True
        
        except Exception as e:
            logger.error(f"Usage recording failed: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def purchase_model(
        db: Session,
        model_id: int,
        buyer_id: int,
        organization_id: Optional[int] = None,
        duration_days: int = 365
    ) -> Optional[ModelPurchase]:
        try:
            model = db.query(PublishedModel).filter(PublishedModel.id == model_id).first()
            if not model:
                return None
            
            license_key = f"LIC-{uuid.uuid4().hex.upper()}"
            purchase = ModelPurchase(
                model_id=model_id,
                buyer_id=buyer_id,
                organization_id=organization_id,
                price=model.price_one_time or 0.0,
                license_key=license_key,
                activated_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=duration_days)
            )
            
            db.add(purchase)
            db.commit()
            db.refresh(purchase)
            return purchase
        
        except Exception as e:
            logger.error(f"Model purchase failed: {str(e)}")
            db.rollback()
            return None
    
    @staticmethod
    def get_trending_models(
        db: Session,
        days: int = 7,
        limit: int = 10
    ) -> List[PublishedModel]:
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            return db.query(PublishedModel).filter(
                PublishedModel.is_published == True,
                PublishedModel.published_at >= cutoff_date
            ).order_by(PublishedModel.download_count.desc()).limit(limit).all()
        except Exception as e:
            logger.error(f"Get trending models failed: {str(e)}")
            return []
    
    @staticmethod
    def get_creator_earnings(
        db: Session,
        creator_id: int,
        month: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            if not month:
                month = datetime.utcnow().strftime("%Y-%m")
            
            creator_models = db.query(PublishedModel).filter(PublishedModel.creator_id == creator_id).all()
            model_ids = [m.id for m in creator_models]
            
            usage_records = db.query(ModelUsageRecord).filter(
                ModelUsageRecord.model_id.in_(model_ids),
                ModelUsageRecord.month == month
            ).all() if model_ids else []
            
            total_revenue = sum(r.total_cost for r in usage_records)
            platform_fee = total_revenue * 0.15
            creator_earnings = total_revenue - platform_fee
            
            return {
                "month": month,
                "total_revenue": total_revenue,
                "platform_fee": platform_fee,
                "creator_earnings": creator_earnings,
                "usage_records": len(usage_records)
            }
        except Exception as e:
            logger.error(f"Get earnings failed: {str(e)}")
            return {}
