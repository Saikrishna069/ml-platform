from pydantic import BaseModel

class MarketplaceSettings(BaseModel):
    """Marketplace configuration"""
    
    platform_fee_percentage: float = 0.15
    minimum_price_per_inference: float = 0.001
    maximum_price_per_inference: float = 10.0
    
    max_model_size_mb: int = 1000
    max_models_per_user: int = 100
    
    min_review_length: int = 10
    max_review_length: int = 5000
    
    models_per_page: int = 20
    trending_threshold_days: int = 7
    
    minimum_payout_amount: float = 10.0
    payout_frequency_days: int = 30
    
    require_approval: bool = False
    auto_approve_threshold_reviews: int = 3

marketplace_settings = MarketplaceSettings()
