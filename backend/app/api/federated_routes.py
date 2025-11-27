"""
Federated Learning API Routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List
from pydantic import BaseModel
from ..services.federated.coordinator import FederatedCoordinator
from ..database.schema import Database

# Initialize coordinator (will be set in main app)
coordinator: Optional[FederatedCoordinator] = None

def set_coordinator(coord: FederatedCoordinator):
    """Set the coordinator instance"""
    global coordinator
    coordinator = coord

router = APIRouter(prefix="/federated", tags=["federated"])

class OrganizationRegistration(BaseModel):
    org_id: str
    org_name: str
    address: Optional[str] = None

class ModelUpdate(BaseModel):
    org_id: str
    round: int
    update: List[List[float]]  # Serialized gradients
    metrics: Optional[dict] = None

class RoundStart(BaseModel):
    round_number: Optional[int] = None

@router.post("/register")
async def register_organization(registration: OrganizationRegistration):
    """Register a new organization for federated learning"""
    if not coordinator:
        raise HTTPException(status_code=503, detail="Federated coordinator not initialized")
    
    success = coordinator.register_organization(
        org_id=registration.org_id,
        org_address=registration.address or f"{registration.org_id}.example.com"
    )
    
    if success:
        return {
            "status": "registered",
            "org_id": registration.org_id,
            "message": "Organization registered successfully"
        }
    else:
        raise HTTPException(status_code=400, detail="Registration failed")

@router.post("/upload-update")
async def upload_update(update: ModelUpdate, authorization: Optional[str] = Header(None)):
    """Upload encrypted gradient update from organization"""
    if not coordinator:
        raise HTTPException(status_code=503, detail="Federated coordinator not initialized")
    
    # In production, verify authorization token
    # For now, accept the update
    
    # Store update (in production, this would be encrypted)
    print(f"Received update from {update.org_id} for round {update.round}")
    
    return {
        "status": "received",
        "org_id": update.org_id,
        "round": update.round,
        "message": "Update received successfully"
    }

@router.get("/download-model")
async def download_model(authorization: Optional[str] = Header(None)):
    """Download current global model"""
    if not coordinator:
        raise HTTPException(status_code=503, detail="Federated coordinator not initialized")
    
    # Return current global model weights
    return {
        "model_version": coordinator.model_distributor.global_model_version,
        "weights": coordinator.global_model_weights or {},
        "round": coordinator.current_round
    }

@router.get("/status")
async def get_status():
    """Get federated learning status"""
    if not coordinator:
        raise HTTPException(status_code=503, detail="Federated coordinator not initialized")
    
    return coordinator.get_status()

@router.post("/start-round")
async def start_round(round_start: RoundStart):
    """Start a new federated learning round"""
    if not coordinator:
        raise HTTPException(status_code=503, detail="Federated coordinator not initialized")
    
    result = coordinator.run_federated_learning_round()
    return result

@router.get("/history")
async def get_history(limit: int = 10):
    """Get federated learning history"""
    if not coordinator:
        raise HTTPException(status_code=503, detail="Federated coordinator not initialized")
    
    summary = coordinator.get_training_summary()
    return {
        "history": summary['round_history'][:limit],
        "total_rounds": summary['total_rounds']
    }

