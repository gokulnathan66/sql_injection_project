"""
Local Training Manager
Handles local model training at organization endpoints
"""
import numpy as np
import pickle
from pathlib import Path
from typing import Dict, Tuple, Optional, List
from datetime import datetime
from ..ml_detector import MLDetector

class LocalTrainer:
    def __init__(self, org_id: str, model_architecture: str = 'random_forest'):
        self.org_id = org_id
        self.model_architecture = model_architecture
        self.local_model = None
        self.training_history = []
        self.current_round = 0
    
    def load_model(self, model_path: str):
        """Load model from file"""
        if Path(model_path).exists():
            self.local_model = MLDetector(model_path=model_path)
            print(f"[{self.org_id}] Model loaded from {model_path}")
        else:
            # Initialize new model
            self.local_model = MLDetector()
            print(f"[{self.org_id}] New model initialized")
    
    def download_global_model(self, global_weights: Optional[Dict] = None):
        """Download current global model weights"""
        # For Random Forest, we use the model file directly
        # In a full implementation, this would deserialize weights
        if global_weights:
            # Store global weights for reference
            self.global_weights = global_weights
        print(f"[{self.org_id}] Downloaded global model for round {self.current_round}")
    
    def train_local_model(
        self,
        local_data: Dict[str, np.ndarray],
        num_epochs: int = 1,
        batch_size: int = 32
    ) -> Tuple[List[np.ndarray], Dict]:
        """Train model locally on organization's data"""
        print(f"[{self.org_id}] Starting local training for round {self.current_round}")
        print(f"  - Training samples: {len(local_data['features'])}")
        print(f"  - Epochs: {num_epochs}")
        
        if self.local_model is None:
            self.local_model = MLDetector()
        
        # Get initial model state (for Random Forest, we train from scratch)
        # In a full implementation, we'd get initial weights
        
        # Train the model
        metrics = self.local_model.train(
            local_data['features'],
            local_data['labels']
        )
        
        # Compute update (for Random Forest, we return model differences)
        # In practice, this would be gradient updates
        local_update = self._compute_model_update()
        
        self.training_history.append({
            'round': self.current_round,
            'timestamp': datetime.now().isoformat(),
            'samples_trained': len(local_data['features']),
            'epochs': num_epochs,
            'metrics': metrics
        })
        
        print(f"[{self.org_id}] Local training completed")
        print(f"  - Accuracy: {metrics.get('accuracy', 0):.4f}")
        
        return local_update, metrics
    
    def _compute_model_update(self) -> List[np.ndarray]:
        """Compute model weight updates"""
        # For Random Forest, we return feature importance as update
        # In a full neural network implementation, this would be gradients
        if self.local_model and hasattr(self.local_model, 'model') and self.local_model.model:
            # Extract feature importances as a proxy for updates
            if hasattr(self.local_model.model, 'feature_importances_'):
                importances = self.local_model.model.feature_importances_
                return [np.array(importances)]
        # Return placeholder update (28 features for Random Forest)
        return [np.random.rand(28) * 0.01]  # Small random update as placeholder
    
    def load_local_data(self, data_source: str) -> Dict[str, np.ndarray]:
        """Load organization's local training data"""
        data_path = Path(data_source)
        
        if (data_path / "features.npy").exists() and (data_path / "labels.npy").exists():
            local_data = {
                'features': np.load(data_path / "features.npy"),
                'labels': np.load(data_path / "labels.npy")
            }
            print(f"[{self.org_id}] Loaded {len(local_data['features'])} local samples")
        else:
            # Return empty data structure
            local_data = {
                'features': np.array([]),
                'labels': np.array([])
            }
            print(f"[{self.org_id}] No local data found at {data_source}")
        
        return local_data
    
    def save_model(self, path: str):
        """Save trained model to disk"""
        if self.local_model:
            self.local_model.save_model(path)
            print(f"[{self.org_id}] Model saved to {path}")

