import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import json

logger = logging.getLogger('performance')

class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Monitor API performance"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        process_time = time.time() - start_time
        
        log_data = {
            "timestamp": start_time,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time_seconds": round(process_time, 3),
            "client_ip": request.client.host if request.client else "unknown"
        }
        
        if process_time > 1.0:
            logger.warning(f"Slow request: {json.dumps(log_data)}")
        else:
            logger.info(f"Request: {json.dumps(log_data)}")
        
        response.headers["X-Process-Time"] = str(process_time)
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests"""
    
    async def dispatch(self, request: Request, call_next):
        log = logging.getLogger(__name__)
        log.info(f"Request: {request.method} {request.url.path}")
        response = await call_next(request)
        log.info(f"Response: {response.status_code}")
        return response
