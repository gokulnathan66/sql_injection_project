"""
Knowledge Base Service
Manages attack storage and pattern analysis
"""
from typing import Dict, List, Optional
from datetime import datetime
from ..database.schema import Database

class KnowledgeBase:
    def __init__(self, db: Database):
        self.db = db
    
    async def store_detection(
        self,
        query: str,
        normalized_query: str,
        is_malicious: bool,
        confidence: float,
        attack_type: Optional[str] = None,
        source_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        response_time_ms: Optional[float] = None
    ) -> int:
        """Store detection result in knowledge base"""
        return await self.db.insert_attack(
            query=query,
            normalized_query=normalized_query,
            is_malicious=is_malicious,
            confidence=confidence,
            attack_type=attack_type,
            source_ip=source_ip,
            user_agent=user_agent,
            response_time_ms=response_time_ms
        )
    
    async def get_attack_history(self, limit: int = 100) -> List[Dict]:
        """Retrieve attack history"""
        return await self.db.get_recent_attacks(limit)
    
    async def get_statistics(self) -> Dict:
        """Get comprehensive statistics"""
        return await self.db.get_statistics()
    
    async def get_timeline(self, hours: int = 24) -> List[Dict]:
        """Get attack timeline"""
        return await self.db.get_attack_timeline(hours)
    
    async def analyze_patterns(self) -> Dict:
        """Analyze attack patterns"""
        stats = await self.get_statistics()
        
        # Basic pattern analysis
        patterns = {
            'most_common_attack': None,
            'attack_frequency': {},
            'threat_level': 'LOW'
        }
        
        if stats['attack_type_distribution']:
            most_common = max(
                stats['attack_type_distribution'].items(),
                key=lambda x: x[1]
            )
            patterns['most_common_attack'] = most_common[0]
            patterns['attack_frequency'] = stats['attack_type_distribution']
        
        # Determine threat level
        if stats['detection_rate'] > 50:
            patterns['threat_level'] = 'CRITICAL'
        elif stats['detection_rate'] > 30:
            patterns['threat_level'] = 'HIGH'
        elif stats['detection_rate'] > 10:
            patterns['threat_level'] = 'MEDIUM'
        
        return patterns

