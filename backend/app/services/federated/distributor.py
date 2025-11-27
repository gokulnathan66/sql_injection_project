"""
Model Distributor
Distributes global models to organization clients
"""
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

class ModelDistributor:
    def __init__(self, db_connection=None):
        self.db = db_connection
        self.clients = []
        self.global_model_version = 0
    
    def register_client(self, client_id: str, client_address: str, public_key: Optional[str] = None):
        """Register federated learning client"""
        self.clients.append({
            'client_id': client_id,
            'address': client_address,
            'public_key': public_key,
            'last_update': None,
            'status': 'REGISTERED'
        })
        print(f"Registered client: {client_id}")
    
    def distribute_global_model(self, global_weights: Dict, model_path: Optional[str] = None) -> List[Dict]:
        """Distribute updated global model to all clients"""
        print(f"Distributing global model v{self.global_model_version}")
        
        distribution_results = []
        
        for client in self.clients:
            try:
                # In a real implementation, we'd send model to client via HTTP
                # For now, we just mark as distributed
                result = {
                    'client_id': client['client_id'],
                    'status': 'SUCCESS',
                    'model_version': self.global_model_version,
                    'timestamp': datetime.now().isoformat()
                }
                
                client['last_update'] = datetime.now()
                client['status'] = 'UPDATED'
                
                distribution_results.append(result)
            
            except Exception as e:
                distribution_results.append({
                    'client_id': client['client_id'],
                    'status': 'FAILED',
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        # Log distribution
        self._log_distribution(distribution_results)
        
        return distribution_results
    
    def _log_distribution(self, results: List[Dict]):
        """Log distribution results"""
        successful = sum(1 for r in results if r['status'] == 'SUCCESS')
        print(f"Distribution complete: {successful}/{len(self.clients)} clients updated")
        
        self.global_model_version += 1
    
    def get_model_info(self) -> Dict:
        """Get current global model information"""
        return {
            'version': self.global_model_version,
            'registered_clients': len(self.clients),
            'clients': [
                {
                    'id': c['client_id'],
                    'status': c['status'],
                    'last_update': c['last_update'].isoformat() if c['last_update'] else None
                }
                for c in self.clients
            ]
        }

