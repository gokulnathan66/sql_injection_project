"""
Database Schema for Knowledge Base
SQLite database for storing attack data
"""
import sqlite3
import aiosqlite
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

class Database:
    def __init__(self, db_path: str = "data/knowledge_base.db"):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    async def initialize(self):
        """Create database tables"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS attacks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    query TEXT NOT NULL,
                    normalized_query TEXT,
                    is_malicious INTEGER NOT NULL,
                    confidence REAL NOT NULL,
                    attack_type TEXT,
                    source_ip TEXT,
                    user_agent TEXT,
                    response_time_ms REAL
                )
            """)
            
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp ON attacks(timestamp)
            """)
            
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_is_malicious ON attacks(is_malicious)
            """)
            
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_attack_type ON attacks(attack_type)
            """)
            
            await db.commit()
        
        print(f"Database initialized at {self.db_path}")
    
    async def insert_attack(
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
        """Insert attack record"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO attacks (
                    timestamp, query, normalized_query, is_malicious,
                    confidence, attack_type, source_ip, user_agent, response_time_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                datetime.now().isoformat(),
                query,
                normalized_query,
                1 if is_malicious else 0,
                confidence,
                attack_type,
                source_ip,
                user_agent,
                response_time_ms
            ))
            
            await db.commit()
            return cursor.lastrowid
    
    async def get_recent_attacks(self, limit: int = 100) -> List[Dict]:
        """Get recent attack records"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM attacks
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def get_statistics(self) -> Dict:
        """Get attack statistics"""
        async with aiosqlite.connect(self.db_path) as db:
            # Total queries
            async with db.execute("SELECT COUNT(*) FROM attacks") as cursor:
                total_queries = (await cursor.fetchone())[0]
            
            # Malicious queries
            async with db.execute(
                "SELECT COUNT(*) FROM attacks WHERE is_malicious = 1"
            ) as cursor:
                malicious_queries = (await cursor.fetchone())[0]
            
            # Average confidence
            async with db.execute(
                "SELECT AVG(confidence) FROM attacks WHERE is_malicious = 1"
            ) as cursor:
                avg_confidence = (await cursor.fetchone())[0] or 0.0
            
            # Attack type distribution
            async with db.execute("""
                SELECT attack_type, COUNT(*) as count
                FROM attacks
                WHERE is_malicious = 1 AND attack_type IS NOT NULL
                GROUP BY attack_type
            """) as cursor:
                attack_types = {}
                async for row in cursor:
                    attack_types[row[0]] = row[1]
            
            detection_rate = (malicious_queries / total_queries * 100) if total_queries > 0 else 0
            
            return {
                'total_queries': total_queries,
                'malicious_queries': malicious_queries,
                'benign_queries': total_queries - malicious_queries,
                'detection_rate': detection_rate,
                'average_confidence': avg_confidence,
                'attack_type_distribution': attack_types
            }
    
    async def get_attack_timeline(self, hours: int = 24) -> List[Dict]:
        """Get attack timeline for visualization"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT 
                    strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                    COUNT(*) as count,
                    SUM(CASE WHEN is_malicious = 1 THEN 1 ELSE 0 END) as malicious_count
                FROM attacks
                WHERE datetime(timestamp) >= datetime('now', '-' || ? || ' hours')
                GROUP BY hour
                ORDER BY hour
            """, (hours,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

