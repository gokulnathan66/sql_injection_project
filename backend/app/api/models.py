"""
Pydantic Models for API Request/Response
"""
from pydantic import BaseModel, Field
from typing import Optional

class QueryRequest(BaseModel):
    query: str = Field(..., description="SQL query to analyze")
    source_ip: Optional[str] = Field(None, description="Source IP address")
    user_agent: Optional[str] = Field(None, description="User agent string")

class DetectionResponse(BaseModel):
    is_malicious: bool
    confidence: float
    attack_type: Optional[str]
    normalized_query: str
    original_query: str
    response_time_ms: float

class VulnerableQueryRequest(BaseModel):
    user_id: str = Field(..., description="User ID for vulnerable query")

class AttackRecord(BaseModel):
    id: int
    timestamp: str
    query: str
    normalized_query: Optional[str]
    is_malicious: int
    confidence: float
    attack_type: Optional[str]
    source_ip: Optional[str]
    user_agent: Optional[str]
    response_time_ms: Optional[float]

class Statistics(BaseModel):
    total_queries: int
    malicious_queries: int
    benign_queries: int
    detection_rate: float
    average_confidence: float
    attack_type_distribution: dict

