from sqlalchemy import text, event, Engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import Pool
import logging
import time
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class QueryOptimizer:
    """Database query optimization and monitoring"""
    
    @staticmethod
    def enable_query_logging(engine: Engine):
        """Enable SQL query logging"""
        @event.listens_for(engine, "before_cursor_execute")
        def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            conn.info.setdefault('query_start_time', []).append(time.time())
            logger.debug(f"Query: {statement}")
        
        @event.listens_for(engine, "after_cursor_execute")
        def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            if conn.info.get('query_start_time'):
                total_time = time.time() - conn.info['query_start_time'].pop(-1)
                if total_time > 0.5:
                    logger.warning(f"Slow query ({total_time:.2f}s): {statement}")
    
    @staticmethod
    def create_indexes(db: Session):
        """Create recommended indexes"""
        indexes = [
            ("users", "email", False),
            ("users", "organization_id", False),
            ("datasets", "owner_id", False),
            ("datasets", "organization_id", False),
            ("datasets", "created_at", False),
            ("experiments", "dataset_id", False),
            ("experiments", "owner_id", False),
            ("experiments", "created_at", False),
            ("model_deployments", "registry_id", False),
            ("model_deployments", "environment", False),
            ("model_deployments", "status", False),
            ("published_models", "creator_id", False),
            ("published_models", "category", False),
            ("published_models", "is_published", False),
            ("published_models", "average_rating", False),
        ]
        
        for table, column, unique in indexes:
            try:
                if unique:
                    db.execute(text(f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{table}_{column} ON {table}({column})"))
                else:
                    db.execute(text(f"CREATE INDEX IF NOT EXISTS idx_{table}_{column} ON {table}({column})"))
            except Exception as e:
                logger.warning(f"Index creation skipped for {table}.{column}: {str(e)}")
        
        db.commit()

class CacheStrategy:
    """Intelligent caching strategies"""
    
    @staticmethod
    def get_cache_key(entity_type: str, entity_id: int, version: str = "v1") -> str:
        return f"{entity_type}:{entity_id}:{version}"
    
    @staticmethod
    def get_list_cache_key(entity_type: str, filters: Dict[str, Any] = None) -> str:
        filter_str = "_".join(f"{k}={v}" for k, v in (filters or {}).items())
        return f"{entity_type}:list:{filter_str}" if filter_str else f"{entity_type}:list"
    
    @staticmethod
    def should_cache(result_size_mb: float, ttl_seconds: int) -> bool:
        return result_size_mb < 100 and ttl_seconds > 60

class QueryBatcher:
    """Batch queries for efficiency"""
    
    @staticmethod
    def batch_load(db: Session, ids: List[int], model_class) -> Dict[int, Any]:
        try:
            items = db.query(model_class).filter(model_class.id.in_(ids)).all()
            return {item.id: item for item in items}
        except Exception as e:
            logger.error(f"Batch load failed: {str(e)}")
            return {}
