import os
from enum import Enum
from functools import lru_cache

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class DevelopmentSettings:
    """Development environment settings"""
    DEBUG = True
    TESTING = False
    DATABASE_ECHO = True
    REDIS_DECODE_RESPONSES = True

class StagingSettings:
    """Staging environment settings"""
    DEBUG = False
    TESTING = False
    DATABASE_ECHO = False
    REDIS_DECODE_RESPONSES = True

class ProductionSettings:
    """Production environment settings"""
    DEBUG = False
    TESTING = False
    DATABASE_ECHO = False
    REDIS_DECODE_RESPONSES = True

class TestingSettings:
    """Testing environment settings"""
    DEBUG = True
    TESTING = True
    DATABASE_URL = "sqlite:///./test.db"
    REDIS_URL = "redis://localhost:6379/1"
    DATABASE_ECHO = False

@lru_cache()
def get_environment_settings():
    """Get environment-specific settings"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "staging":
        return StagingSettings()
    elif env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()
