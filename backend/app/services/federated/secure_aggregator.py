"""
Secure Aggregation Service
Aggregates encrypted model updates from multiple organizations
"""
import numpy as np
from typing import Dict, List
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import json
import base64

class SecureAggregator:
    def __init__(self, num_clients: int):
        self.num_clients = num_clients
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.public_key = self.private_key.public_key()
        self.client_public_keys = {}
        self.encrypted_updates = {}
    
    def setup_public_keys(self, client_id: str, client_public_key_pem: str):
        """Register client public key"""
        from cryptography.hazmat.primitives import serialization
        public_key = serialization.load_pem_public_key(client_public_key_pem.encode())
        self.client_public_keys[client_id] = public_key
        print(f"Registered public key for client {client_id}")
    
    def encrypt_update_for_transmission(self, client_id: str, local_update: List[np.ndarray]) -> str:
        """Encrypt client update before transmission"""
        # Serialize the update
        serialized_update = self._serialize_update(local_update)
        
        # Encrypt with server's public key
        encrypted = self.public_key.encrypt(
            serialized_update,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        # Encode as base64 for transmission
        return base64.b64encode(encrypted).decode('utf-8')
    
    def receive_encrypted_update(self, client_id: str, encrypted_update: str):
        """Receive encrypted update from client"""
        self.encrypted_updates[client_id] = encrypted_update
        print(f"Received encrypted update from {client_id}")
    
    def aggregate_with_secure_computation(self) -> str:
        """Aggregate updates using secure multi-party computation"""
        if len(self.encrypted_updates) < self.num_clients:
            raise Exception(f"Insufficient updates: {len(self.encrypted_updates)}/{self.num_clients}")
        
        print(f"Aggregating {len(self.encrypted_updates)} encrypted updates")
        
        # Decrypt and aggregate
        aggregated_update = None
        
        for client_id, encrypted_update in self.encrypted_updates.items():
            # Decrypt update
            encrypted_bytes = base64.b64decode(encrypted_update)
            decrypted = self.private_key.decrypt(
                encrypted_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            # Deserialize
            update = self._deserialize_update(decrypted)
            
            # Aggregate
            if aggregated_update is None:
                aggregated_update = update
            else:
                # Add updates together
                aggregated_update = [
                    a + u for a, u in zip(aggregated_update, update)
                ]
        
        # Average across clients
        averaged_update = [u / len(self.encrypted_updates) for u in aggregated_update]
        
        # Serialize aggregated result
        return self._serialize_update(averaged_update)
    
    def decrypt_aggregated_update(self, aggregated_encrypted: str) -> List[np.ndarray]:
        """Decrypt aggregated update"""
        # Deserialize
        aggregated_update = self._deserialize_update(aggregated_encrypted.encode())
        
        print(f"Decrypted and averaged aggregated update")
        print(f"  - Update magnitude: {sum(np.linalg.norm(u) for u in aggregated_update):.4f}")
        
        return aggregated_update
    
    def _serialize_update(self, update: List[np.ndarray]) -> bytes:
        """Serialize update to bytes"""
        # Convert numpy arrays to lists for JSON serialization
        update_list = [arr.tolist() for arr in update]
        json_str = json.dumps(update_list)
        return json_str.encode('utf-8')
    
    def _deserialize_update(self, data: bytes) -> List[np.ndarray]:
        """Deserialize update from bytes"""
        json_str = data.decode('utf-8')
        update_list = json.loads(json_str)
        return [np.array(arr) for arr in update_list]


