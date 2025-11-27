"""
Proxy Service
Intercepts HTTP requests and routes suspicious traffic to honeypot
"""
from fastapi import Request, Response
from typing import Optional
from .detection import is_suspicious, extract_sql_like
from ..honeypot.service import HoneypotService

class ProxyService:
    def __init__(self, honeypot_service: HoneypotService):
        self.honeypot_service = honeypot_service
    
    async def intercept_request(
        self,
        request: Request,
        path: str = ""
    ) -> Optional[Response]:
        """
        Intercept request and check for suspicious SQL patterns
        Returns Response if suspicious (routed to honeypot), None if benign
        """
        body = await request.body()
        payload = body.decode(errors="ignore") if body else ""
        
        # Extract SQL-like patterns
        sql_frag = extract_sql_like(payload)
        
        # Check if suspicious
        if is_suspicious(sql_frag):
            # Route to honeypot
            return await self.honeypot_service.handle_attack(
                request=request,
                parsed_sql=sql_frag,
                path=path
            )
        
        # Not suspicious, return None to continue normal processing
        return None

