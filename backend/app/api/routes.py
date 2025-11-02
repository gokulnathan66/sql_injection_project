"""
API Routes for SQL Injection Detection
"""
import time
import numpy as np
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List
import json

from .models import (
    QueryRequest, DetectionResponse, VulnerableQueryRequest,
    AttackRecord, Statistics
)
from ..services.normalizer import QueryNormalizer
from ..services.feature_extractor import FeatureExtractor
from ..services.ml_detector import MLDetector
from ..services.knowledge_base import KnowledgeBase
from ..database.schema import Database

# Initialize services
normalizer = QueryNormalizer()
feature_extractor = FeatureExtractor()
ml_detector = MLDetector(model_path='app/models/rf_detector.pkl')
database = Database()
knowledge_base = KnowledgeBase(database)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Create router
router = APIRouter()

@router.post("/detect", response_model=DetectionResponse)
async def detect_sql_injection(request: QueryRequest):
    """
    Detect SQL injection in a query
    """
    start_time = time.time()
    
    try:
        # Step 1: Normalize query
        normalized = normalizer.normalize(request.query)
        
        # Step 2: Extract features
        features = feature_extractor.extract_as_array(normalized)
        features_array = np.array(features)
        
        # Step 3: ML Detection
        is_malicious, confidence = ml_detector.predict(features_array)
        
        # Step 4: Identify attack type if malicious
        attack_type = None
        if is_malicious:
            attack_type = ml_detector.identify_attack_type(normalized)
        
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Step 5: Store in knowledge base
        await knowledge_base.store_detection(
            query=request.query,
            normalized_query=normalized,
            is_malicious=is_malicious,
            confidence=confidence,
            attack_type=attack_type,
            source_ip=request.source_ip,
            user_agent=request.user_agent,
            response_time_ms=response_time
        )
        
        # Step 6: Broadcast to WebSocket clients if malicious
        if is_malicious:
            await manager.broadcast({
                'type': 'attack_detected',
                'data': {
                    'query': request.query[:100] + '...' if len(request.query) > 100 else request.query,
                    'attack_type': attack_type,
                    'confidence': confidence,
                    'timestamp': time.time()
                }
            })
        
        return DetectionResponse(
            is_malicious=is_malicious,
            confidence=confidence,
            attack_type=attack_type,
            normalized_query=normalized,
            original_query=request.query,
            response_time_ms=response_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vulnerable")
async def vulnerable_endpoint(request: VulnerableQueryRequest):
    """
    Intentionally vulnerable endpoint for testing
    WARNING: This is for demonstration only!
    """
    # Simulate vulnerable SQL query (DO NOT use in production!)
    vulnerable_query = f"SELECT * FROM users WHERE id = '{request.user_id}'"
    
    # Detect the injection
    detection = await detect_sql_injection(
        QueryRequest(query=vulnerable_query, source_ip="127.0.0.1")
    )
    
    return {
        'query_executed': vulnerable_query,
        'detection_result': detection,
        'warning': 'This endpoint is intentionally vulnerable for demonstration'
    }

@router.get("/attacks", response_model=List[AttackRecord])
async def get_attacks(limit: int = 100):
    """
    Get recent attack history
    """
    try:
        attacks = await knowledge_base.get_attack_history(limit)
        return attacks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=Statistics)
async def get_statistics():
    """
    Get detection statistics
    """
    try:
        stats = await knowledge_base.get_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timeline")
async def get_timeline(hours: int = 24):
    """
    Get attack timeline for visualization
    """
    try:
        timeline = await knowledge_base.get_timeline(hours)
        return timeline
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns")
async def get_patterns():
    """
    Get attack pattern analysis
    """
    try:
        patterns = await knowledge_base.analyze_patterns()
        return patterns
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_json({'type': 'pong'})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

