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
    
    success = await coordinator.register_organization(
        org_id=registration.org_id,
        org_address=registration.address or f"{registration.org_id}.example.com",
        org_name=registration.org_name
    )
    
    if success:
        return {
            "status": "registered",
            "org_id": registration.org_id,
            "org_name": registration.org_name,
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
    
    # Store update in database
    if coordinator.db:
        try:
            import hashlib
            # Create hash of update for tracking
            update_str = str(update.update) + str(update.metrics or {})
            update_hash = hashlib.sha256(update_str.encode()).hexdigest()[:16]
            
            await coordinator.db.log_gradient_update(
                org_id=update.org_id,
                round_number=update.round,
                update_hash=update_hash
            )
        except Exception as e:
            print(f"Error logging gradient update: {e}")
    
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
    
    status = coordinator.get_status()
    
    # Add database information if available
    if coordinator.db:
        try:
            organizations = await coordinator.db.get_organizations()
            status['organizations'] = organizations
            status['total_organizations'] = len(organizations)
            status['active_organizations'] = len([o for o in organizations if o.get('status') == 'active'])
        except Exception as e:
            status['database_error'] = str(e)
    
    return status

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

@router.get("/organizations")
async def get_organizations():
    """Get all registered organizations"""
    if not coordinator:
        raise HTTPException(status_code=503, detail="Federated coordinator not initialized")
    
    if coordinator.db:
        try:
            organizations = await coordinator.db.get_organizations()
            return {
                "organizations": organizations,
                "total": len(organizations),
                "active": len([o for o in organizations if o.get('status') == 'active'])
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    else:
        # Fallback to in-memory clients
        return {
            "organizations": [
                {
                    "org_id": c['id'],
                    "org_name": c.get('id', 'Unknown'),
                    "address": c.get('address', ''),
                    "status": "active"
                }
                for c in coordinator.model_distributor.clients
            ],
            "total": len(coordinator.model_distributor.clients),
            "active": len(coordinator.model_distributor.clients)
        }

