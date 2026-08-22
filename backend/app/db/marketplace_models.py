from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class PublishedModel(Base):
    """Published model in marketplace"""
    __tablename__ = "published_models"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, index=True, default="other")
    tags = Column(JSON, nullable=True)
    
    model_type = Column(String, nullable=True)
    framework = Column(String, nullable=True)
    version = Column(String, default="1.0.0")
    
    accuracy = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_score = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    
    input_features = Column(JSON, nullable=True)
    output_type = Column(String, nullable=True)
    training_samples = Column(Integer, nullable=True)
    feature_count = Column(Integer, default=0)
    
    is_published = Column(Boolean, default=False, index=True)
    is_premium = Column(Boolean, default=False)
    price_per_inference = Column(Float, default=0.0)
    price_one_time = Column(Float, nullable=True)
    
    model_url = Column(String, nullable=True)
    model_size_mb = Column(Float, default=0.0)
    
    download_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    
    license = Column(String, default="CC-BY-4.0")
    documentation_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)

class MarketplaceModelVersion(Base):
    """Marketplace model versions"""
    __tablename__ = "marketplace_model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("published_models.id"), nullable=False)
    
    version = Column(String, nullable=False)
    release_notes = Column(Text, nullable=True)
    model_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelReview(Base):
    """Model reviews and ratings"""
    __tablename__ = "model_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("published_models.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)
    title = Column(String, nullable=True)
    review_text = Column(Text, nullable=True)
    
    helpful_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelUsageRecord(Base):
    """Track model usage for billing"""
    __tablename__ = "model_usage_records"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("published_models.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    inference_count = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)
    
    month = Column(String, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelPurchase(Base):
    """One-time model purchases"""
    __tablename__ = "model_purchases"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("published_models.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    price = Column(Float, nullable=False)
    license_key = Column(String, unique=True, nullable=False)
    
    activated_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelCollection(Base):
    """User's collection of models"""
    __tablename__ = "model_collections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelCollectionItem(Base):
    """Items in a collection"""
    __tablename__ = "model_collection_items"
    
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("model_collections.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("published_models.id"), nullable=False)
    
    added_at = Column(DateTime, default=datetime.utcnow)
