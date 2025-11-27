"""
Federated Learning Database Schema
"""
import aiosqlite
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

class FederatedDatabase:
    def __init__(self, db_path: str = "data/knowledge_base.db"):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    async def initialize_federated_tables(self):
        """Create federated learning tables"""
        async with aiosqlite.connect(self.db_path) as db:
            # Organizations table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS organizations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    org_id TEXT UNIQUE NOT NULL,
                    org_name TEXT NOT NULL,
                    address TEXT,
                    registered_at TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    last_update TEXT
                )
            """)
            
            # Federated rounds table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS federated_rounds (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    round_number INTEGER NOT NULL,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    participants INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    metrics TEXT
                )
            """)
            
            # Model versions table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS model_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version INTEGER UNIQUE NOT NULL,
                    created_at TEXT NOT NULL,
                    model_path TEXT,
                    metrics TEXT
                )
            """)
            
            # Gradient updates table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS gradient_updates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    org_id TEXT NOT NULL,
                    round_number INTEGER NOT NULL,
                    received_at TEXT NOT NULL,
                    update_hash TEXT,
                    status TEXT DEFAULT 'received',
                    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
                )
            """)
            
            # Privacy budgets table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS privacy_budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    org_id TEXT NOT NULL,
                    epsilon REAL NOT NULL,
                    delta REAL NOT NULL,
                    budget_used REAL DEFAULT 0.0,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
                )
            """)
            
            # Create indexes
            await db.execute("CREATE INDEX IF NOT EXISTS idx_org_id ON organizations(org_id)")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_round_number ON federated_rounds(round_number)")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_model_version ON model_versions(version)")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_gradient_org_round ON gradient_updates(org_id, round_number)")
            
            await db.commit()
        
        print("Federated learning tables initialized")
    
    async def register_organization(self, org_id: str, org_name: str, address: Optional[str] = None) -> bool:
        """Register a new organization"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO organizations (org_id, org_name, address, registered_at, status)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    org_id,
                    org_name,
                    address,
                    datetime.now().isoformat(),
                    'active'
                ))
                await db.commit()
            return True
        except Exception as e:
            print(f"Error registering organization: {e}")
            return False
    
    async def log_federated_round(self, round_number: int, participants: int, status: str = 'completed') -> int:
        """Log a federated learning round"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO federated_rounds (round_number, started_at, completed_at, participants, status)
                VALUES (?, ?, ?, ?, ?)
            """, (
                round_number,
                datetime.now().isoformat(),
                datetime.now().isoformat() if status == 'completed' else None,
                participants,
                status
            ))
            await db.commit()
            return cursor.lastrowid
    
    async def save_model_version(self, version: int, model_path: Optional[str] = None, metrics: Optional[Dict] = None) -> bool:
        """Save model version information"""
        try:
            import json
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO model_versions (version, created_at, model_path, metrics)
                    VALUES (?, ?, ?, ?)
                """, (
                    version,
                    datetime.now().isoformat(),
                    model_path,
                    json.dumps(metrics) if metrics else None
                ))
                await db.commit()
            return True
        except Exception as e:
            print(f"Error saving model version: {e}")
            return False
    
    async def log_gradient_update(self, org_id: str, round_number: int, update_hash: Optional[str] = None) -> int:
        """Log a gradient update from an organization"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO gradient_updates (org_id, round_number, received_at, update_hash)
                VALUES (?, ?, ?, ?)
            """, (
                org_id,
                round_number,
                datetime.now().isoformat(),
                update_hash
            ))
            await db.commit()
            return cursor.lastrowid
    
    async def get_organizations(self) -> List[Dict]:
        """Get all registered organizations"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM organizations WHERE status = 'active'") as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    
    async def get_round_history(self, limit: int = 10) -> List[Dict]:
        """Get federated round history"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("""
                SELECT * FROM federated_rounds
                ORDER BY round_number DESC
                LIMIT ?
            """, (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

