"""
Coverage configuration for ML Analyzer
"""

COVERAGE_TARGETS = {
    "overall": 75,
    "app/api": 80,
    "app/ml_pipeline": 85,
    "app/services": 80,
    "app/db": 70,
    "app/cache": 75,
}

EXCLUDED_FILES = [
    "app/config",
    "app/__init__.py",
    "app/main.py",
]
