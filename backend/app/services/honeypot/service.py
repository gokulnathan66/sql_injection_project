"""
Honeypot Service
Decoy system to attract attackers and collect attack data
"""
import json
import time
from datetime import datetime
from fastapi import Request, Response
from typing import Optional
from ..knowledge_base import KnowledgeBase

class HoneypotService:
    def __init__(self, knowledge_base: KnowledgeBase):
        self.knowledge_base = knowledge_base
    
    async def handle_attack(
        self,
        request: Request,
        parsed_sql: str = "",
        path: str = ""
    ) -> Response:
        """
        Handle incoming attack request
        Stores attack data and returns fake response
        """
        body = await request.body()
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Create fake response data
        fake_rows = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
        response_data = {"status": "ok", "rows": fake_rows}
        
        # Extract query from body or parsed SQL
        raw_request = body.decode(errors="ignore") if body else ""
        query = parsed_sql if parsed_sql else raw_request
        
        # Store attack in knowledge base
        try:
            await self.knowledge_base.store_detection(
                query=query[:1000] if query else raw_request[:1000],  # Limit length
                normalized_query=parsed_sql[:1000] if parsed_sql else None,
                is_malicious=True,
                confidence=1.0,  # Honeypot catches are always malicious
                attack_type="honeypot_captured",
                source_ip=client_ip,
                user_agent=user_agent,
                response_time_ms=0.0
            )
        except Exception as e:
            print(f"Honeypot storage error: {e}")
        
        # Return fake response to attacker
        return Response(
            content=json.dumps(response_data),
            media_type="application/json"
        )

