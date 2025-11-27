"""
Federated Learning Client
Organization-side client for federated learning
"""
import requests
import numpy as np
from typing import Dict, Optional
from .local_trainer import LocalTrainer
from .differential_privacy import DifferentialPrivacyEngine

class FederatedClient:
    def __init__(self, org_id: str, org_name: str, coordinator_url: str, api_key: Optional[str] = None):
        self.org_id = org_id
        self.org_name = org_name
        self.coordinator_url = coordinator_url.rstrip('/')
        self.api_key = api_key
        self.local_trainer = LocalTrainer(org_id)
        self.dp_engine = DifferentialPrivacyEngine(epsilon=0.5, delta=1e-6)
        self.current_round = 0
    
    def register_with_coordinator(self) -> bool:
        """Register this organization with the coordinator"""
        try:
            response = requests.post(
                f"{self.coordinator_url}/api/federated/register",
                json={
                    'org_id': self.org_id,
                    'org_name': self.org_name
                },
                headers={'Authorization': f'Bearer {self.api_key}'} if self.api_key else {}
            )
            
            if response.status_code == 200:
                print(f"[{self.org_id}] Successfully registered with coordinator")
                return True
            else:
                print(f"[{self.org_id}] Registration failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"[{self.org_id}] Registration error: {e}")
            return False
    
    def download_global_model(self) -> Optional[Dict]:
        """Download current global model from coordinator"""
        try:
            response = requests.get(
                f"{self.coordinator_url}/api/federated/download-model",
                headers={'Authorization': f'Bearer {self.api_key}'} if self.api_key else {}
            )
            
            if response.status_code == 200:
                model_data = response.json()
                self.local_trainer.download_global_model(model_data.get('weights'))
                return model_data
            else:
                print(f"[{self.org_id}] Failed to download model: {response.status_code}")
                return None
        except Exception as e:
            print(f"[{self.org_id}] Download error: {e}")
            return None
    
    def train_and_upload_update(self, local_data: Dict[str, np.ndarray]) -> bool:
        """Train locally and upload encrypted update to coordinator"""
        try:
            # Train locally
            local_update, metrics = self.local_trainer.train_local_model(local_data)
            
            # Apply differential privacy
            private_update = self.dp_engine.apply_differential_privacy(
                local_update,
                method='laplacian'
            )
            
            # Serialize update
            update_data = {
                'org_id': self.org_id,
                'round': self.current_round,
                'update': [arr.tolist() for arr in private_update],
                'metrics': metrics
            }
            
            # Upload to coordinator
            response = requests.post(
                f"{self.coordinator_url}/api/federated/upload-update",
                json=update_data,
                headers={'Authorization': f'Bearer {self.api_key}'} if self.api_key else {}
            )
            
            if response.status_code == 200:
                print(f"[{self.org_id}] Successfully uploaded update")
                return True
            else:
                print(f"[{self.org_id}] Upload failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"[{self.org_id}] Training/upload error: {e}")
            return False
    
    def get_status(self) -> Dict:
        """Get client status"""
        return {
            'org_id': self.org_id,
            'org_name': self.org_name,
            'coordinator_url': self.coordinator_url,
            'current_round': self.current_round,
            'privacy_status': self.dp_engine.get_privacy_guarantee()
        }

