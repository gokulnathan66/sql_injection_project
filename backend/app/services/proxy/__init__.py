"""
Proxy Service
Intercepts requests and routes suspicious traffic to honeypot
"""
from .detection import is_suspicious, extract_sql_like
from .service import ProxyService

__all__ = ['ProxyService', 'is_suspicious', 'extract_sql_like']


