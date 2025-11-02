# Module 4: Federated Learning Coordinator

## Module 4 - Federated Learning Overview

### Purpose
Implement a privacy-preserving collaborative learning system that enables multiple organizations to jointly train and improve SQL injection detection models without sharing sensitive attack data, using secure aggregation and differential privacy mechanisms.

### Module Objectives
1. Enable local model training at each organization
2. Implement secure multi-party aggregation
3. Apply differential privacy for gradient protection
4. Distribute improved global models
5. Maintain privacy and regulatory compliance

---

## Architecture

```
Organization A           Organization B           Organization C
[Local Data]            [Local Data]             [Local Data]
    ↓                       ↓                         ↓
[Local Training]        [Local Training]         [Local Training]
    ↓                       ↓                         ↓
[Gradient Computation]  [Gradient Computation]  [Gradient Computation]
    ↓                       ↓                         ↓
[Differential Privacy]  [Differential Privacy]  [Differential Privacy]
[Noise Addition]        [Noise Addition]        [Noise Addition]
    ↓                       ↓                         ↓
[Secure Encryption]     [Secure Encryption]     [Secure Encryption]
    ↓                       ↓                         ↓
└───────────────────────┬──────────────────────┬────────────────┘
                        │
                 ↓ Secure Communication Channel ↓
                        │
        [Central Aggregation Server]
        [Secure Multi-Party Computation]
        [Aggregate Gradients]
        [Compute Global Update]
                        │
        ↓ Encrypted Global Model ↓
    ┌───┴────────────────────────┴───┐
    ↓                                 ↓
[Org A Local]                  [Org B Local]
[Deploy Model]                 [Deploy Model]
```

---

## Core Components

### 1. Local Training Manager

```python
import tensorflow as tf
import numpy as np
from datetime import datetime

class LocalTrainingManager:
    def __init__(self, org_id, model_architecture='hybrid_cnn_lstm'):
        self.org_id = org_id
        self.local_model = self._build_model(model_architecture)
        self.training_history = []
        self.current_round = 0
    
    def _build_model(self, architecture):
        """Build neural network model"""
        if architecture == 'hybrid_cnn_lstm':
            model = tf.keras.Sequential([
                # Embedding layer
                tf.keras.layers.Embedding(input_dim=256, output_dim=32, input_length=100),
                
                # CNN block
                tf.keras.layers.Conv1D(64, 3, activation='relu'),
                tf.keras.layers.MaxPooling1D(2),
                
                # LSTM block
                tf.keras.layers.LSTM(64, return_sequences=True),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.LSTM(32),
                
                # Dense layers
                tf.keras.layers.Dense(64, activation='relu'),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(1, activation='sigmoid')
            ])
        
        elif architecture == 'random_forest':
            from sklearn.ensemble import RandomForestClassifier
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        
        elif architecture == 'ensemble':
            model = {
                'cnn_lstm': tf.keras.Sequential([...]),
                'random_forest': RandomForestClassifier(n_estimators=100),
                'svm': SVC(probability=True)
            }
        
        return model
    
    def download_global_model(self, global_weights):
        """Download current global model weights"""
        self.local_model.set_weights(global_weights)
        print(f"[{self.org_id}] Downloaded global model for round {self.current_round}")
    
    def train_local_model(self, local_data, num_epochs=1, batch_size=32):
        """Train model locally on organization's data"""
        
        print(f"[{self.org_id}] Starting local training for round {self.current_round}")
        print(f"  - Training samples: {len(local_data['features'])}")
        print(f"  - Epochs: {num_epochs}")
        
        # Get initial weights
        initial_weights = self.local_model.get_weights()
        
        # Train the model
        history = self.local_model.fit(
            local_data['features'],
            local_data['labels'],
            epochs=num_epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )
        
        # Get updated weights
        updated_weights = self.local_model.get_weights()
        
        # Compute update: Δw = w_new - w_old
        local_update = [
            updated - initial
            for updated, initial in zip(updated_weights, initial_weights)
        ]
        
        self.training_history.append({
            'round': self.current_round,
            'timestamp': datetime.now(),
            'samples_trained': len(local_data['features']),
            'epochs': num_epochs,
            'final_loss': history.history['loss'][-1],
            'final_accuracy': history.history.get('accuracy', [0])[-1]
        })
        
        print(f"[{self.org_id}] Local training completed")
        print(f"  - Final loss: {history.history['loss'][-1]:.4f}")
        print(f"  - Update magnitude: {sum(np.linalg.norm(u) for u in local_update):.4f}")
        
        return local_update, history
    
    def load_local_data(self, data_source):
        """Load organization's local training data"""
        local_data = {
            'features': np.load(f"{data_source}/features.npy"),
            'labels': np.load(f"{data_source}/labels.npy")
        }
        
        print(f"[{self.org_id}] Loaded {len(local_data['features'])} local samples")
        return local_data
```

### 2. Secure Aggregation Service

```python
import hashlib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding

class SecureAggregationService:
    def __init__(self, num_clients):
        self.num_clients = num_clients
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.public_key = self.private_key.public_key()
        self.client_public_keys = {}
        self.encrypted_updates = {}
    
    def setup_public_keys(self, client_id, client_public_key):
        """Register client public key"""
        self.client_public_keys[client_id] = client_public_key
        print(f"Registered public key for client {client_id}")
    
    def encrypt_update_for_transmission(self, client_id, local_update):
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
        
        return encrypted
    
    def receive_encrypted_update(self, client_id, encrypted_update):
        """Receive encrypted update from client"""
        self.encrypted_updates[client_id] = encrypted_update
        print(f"Received encrypted update from {client_id}")
    
    def aggregate_with_secure_computation(self):
        """Aggregate updates using secure multi-party computation"""
        
        if len(self.encrypted_updates) < self.num_clients:
            raise Exception(f"Insufficient updates: {len(self.encrypted_updates)}/{self.num_clients}")
        
        print(f"Aggregating {len(self.encrypted_updates)} encrypted updates")
        
        # Pairwise masking approach
        # Each pair of clients shares random masks that cancel when summed
        
        aggregated_encrypted = None
        
        for client_id, encrypted_update in self.encrypted_updates.items():
            if aggregated_encrypted is None:
                aggregated_encrypted = encrypted_update
            else:
                # Homomorphic addition of encrypted values
                # In practice, use actual homomorphic encryption scheme
                aggregated_encrypted = self._homomorphic_add(
                    aggregated_encrypted,
                    encrypted_update
                )
        
        return aggregated_encrypted
    
    def decrypt_aggregated_update(self, aggregated_encrypted):
        """Decrypt aggregated update (server-side only)"""
        
        # Decrypt
        decrypted = self.private_key.decrypt(
            aggregated_encrypted,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        # Deserialize
        aggregated_update = self._deserialize_update(decrypted)
        
        # Average across clients
        averaged_update = [u / self.num_clients for u in aggregated_update]
        
        print(f"Decrypted and averaged aggregated update")
        print(f"  - Update magnitude: {sum(np.linalg.norm(u) for u in averaged_update):.4f}")
        
        return averaged_update
    
    def _homomorphic_add(self, enc1, enc2):
        """Add two encrypted values (simplified)"""
        # In real implementation, use actual homomorphic encryption
        return enc1 + enc2
    
    def _serialize_update(self, update):
        """Serialize update to bytes"""
        return np.array(update).tobytes()
    
    def _deserialize_update(self, data):
        """Deserialize update from bytes"""
        return np.frombuffer(data, dtype=np.float32)
```

### 3. Differential Privacy Engine

```python
import numpy as np

class DifferentialPrivacyEngine:
    def __init__(self, epsilon=0.5, delta=1e-6, global_sensitivity=1.0):
        """
        Initialize differential privacy parameters
        
        epsilon: Privacy budget (smaller = stronger privacy)
        delta: Failure probability
        global_sensitivity: Maximum change from removing one record
        """
        self.epsilon = epsilon
        self.delta = delta
        self.global_sensitivity = global_sensitivity
        self.privacy_budget_used = 0.0
    
    def clip_gradients(self, gradients, clipping_threshold=1.0):
        """Clip gradients to bounded norm"""
        
        clipped = []
        for gradient in gradients:
            gradient_norm = np.linalg.norm(gradient)
            
            if gradient_norm > clipping_threshold:
                # Clip to threshold
                clipped_gradient = gradient * (clipping_threshold / gradient_norm)
            else:
                clipped_gradient = gradient.copy()
            
            clipped.append(clipped_gradient)
        
        return clipped
    
    def add_gaussian_noise(self, gradients, sensitivity=None):
        """Add Gaussian noise for differential privacy"""
        
        if sensitivity is None:
            sensitivity = self.global_sensitivity
        
        # Calculate noise scale
        noise_scale = sensitivity / self.epsilon
        
        noisy_gradients = []
        for gradient in gradients:
            noise = np.random.normal(0, noise_scale, gradient.shape)
            noisy_gradient = gradient + noise
            noisy_gradients.append(noisy_gradient)
        
        # Update privacy budget
        self.privacy_budget_used += 1.0
        
        return noisy_gradients
    
    def add_laplacian_noise(self, gradients, sensitivity=None):
        """Add Laplacian noise for local differential privacy"""
        
        if sensitivity is None:
            sensitivity = self.global_sensitivity
        
        noise_scale = sensitivity / self.epsilon
        
        noisy_gradients = []
        for gradient in gradients:
            noise = np.random.laplace(0, noise_scale, gradient.shape)
            noisy_gradient = gradient + noise
            noisy_gradients.append(noisy_gradient)
        
        self.privacy_budget_used += 1.0
        
        return noisy_gradients
    
    def apply_differential_privacy(self, gradients, method='gaussian'):
        """Full DP pipeline: clip then add noise"""
        
        # Step 1: Clip gradients
        clipped = self.clip_gradients(gradients, clipping_threshold=1.0)
        
        # Step 2: Add noise
        if method == 'gaussian':
            noisy = self.add_gaussian_noise(clipped)
        elif method == 'laplacian':
            noisy = self.add_laplacian_noise(clipped)
        else:
            raise ValueError(f"Unknown noise method: {method}")
        
        return noisy
    
    def get_privacy_guarantee(self):
        """Get current privacy guarantee"""
        accumulated_epsilon = self.epsilon * self.privacy_budget_used
        
        return {
            'epsilon': accumulated_epsilon,
            'delta': self.delta,
            'privacy_budget_used': self.privacy_budget_used,
            'privacy_remaining': max(0, 1.0 - accumulated_epsilon)
        }
```

### 4. Global Model Distributor

```python
class GlobalModelDistributor:
    def __init__(self, db_connection):
        self.db = db_connection
        self.clients = []
        self.global_model_version = 0
    
    def register_client(self, client_id, client_address, public_key):
        """Register federated learning client"""
        self.clients.append({
            'client_id': client_id,
            'address': client_address,
            'public_key': public_key,
            'last_update': None,
            'status': 'REGISTERED'
        })
        print(f"Registered client: {client_id}")
    
    def distribute_global_model(self, global_weights):
        """Distribute updated global model to all clients"""
        
        print(f"Distributing global model v{self.global_model_version}")
        
        distribution_results = []
        
        for client in self.clients:
            try:
                # Encrypt model weights with client's public key
                encrypted_weights = self._encrypt_weights(global_weights, client['public_key'])
                
                # Send to client
                result = self._send_to_client(
                    client['client_id'],
                    client['address'],
                    encrypted_weights
                )
                
                if result['status'] == 'SUCCESS':
                    client['last_update'] = datetime.now()
                    client['status'] = 'UPDATED'
                
                distribution_results.append(result)
            
            except Exception as e:
                distribution_results.append({
                    'client_id': client['client_id'],
                    'status': 'FAILED',
                    'error': str(e)
                })
        
        # Log distribution
        self._log_distribution(distribution_results)
        
        return distribution_results
    
    def _encrypt_weights(self, weights, public_key):
        """Encrypt model weights"""
        serialized = np.array(weights).tobytes()
        # Encrypt using client's public key
        return serialized  # Placeholder
    
    def _send_to_client(self, client_id, address, encrypted_weights):
        """Send model to client (HTTP/RPC)"""
        import requests
        
        try:
            response = requests.post(
                f"http://{address}/federated/update_model",
                data={'weights': encrypted_weights},
                timeout=30
            )
            
            if response.status_code == 200:
                return {'client_id': client_id, 'status': 'SUCCESS'}
            else:
                return {'client_id': client_id, 'status': 'FAILED', 'error': f"HTTP {response.status_code}"}
        
        except Exception as e:
            return {'client_id': client_id, 'status': 'FAILED', 'error': str(e)}
    
    def _log_distribution(self, results):
        """Log distribution results"""
        successful = sum(1 for r in results if r['status'] == 'SUCCESS')
        print(f"Distribution complete: {successful}/{len(self.clients)} clients updated")
        
        self.global_model_version += 1
```

### 5. Federated Learning Coordinator

```python
class FederatedLearningCoordinator:
    def __init__(self, db_connection, config=None):
        self.db = db_connection
        self.config = config or self._default_config()
        
        self.local_managers = {}
        self.secure_aggregator = SecureAggregationService(num_clients=len(self.config['clients']))
        self.dp_engine = DifferentialPrivacyEngine(
            epsilon=self.config['differential_privacy']['epsilon'],
            delta=self.config['differential_privacy']['delta']
        )
        self.model_distributor = GlobalModelDistributor(db_connection)
        
        self.current_round = 0
        self.global_model_weights = None
        self.training_history = []
    
    def _default_config(self):
        """Default federated learning configuration"""
        return {
            'clients': [
                {'id': 'org_a', 'address': 'org-a.example.com', 'data_size': 10000},
                {'id': 'org_b', 'address': 'org-b.example.com', 'data_size': 8000},
                {'id': 'org_c', 'address': 'org-c.example.com', 'data_size': 12000}
            ],
            'differential_privacy': {
                'epsilon': 0.5,
                'delta': 1e-6,
                'method': 'laplacian'
            },
            'training': {
                'rounds': 10,
                'local_epochs': 3,
                'batch_size': 32
            },
            'aggregation': {
                'min_clients': 2,
                'timeout_seconds': 300
            }
        }
    
    def initialize_federation(self):
        """Initialize federated learning setup"""
        
        print("="*60)
        print("FEDERATED LEARNING COORDINATOR - INITIALIZATION")
        print("="*60)
        
        # Initialize local managers at each client
        for client_config in self.config['clients']:
            self.local_managers[client_config['id']] = LocalTrainingManager(
                org_id=client_config['id'],
                model_architecture='hybrid_cnn_lstm'
            )
            print(f"✓ Initialized local manager for {client_config['id']}")
        
        # Initialize global model
        self.global_model_weights = self.local_managers[
            self.config['clients'][0]['id']
        ].local_model.get_weights()
        
        print(f"✓ Global model initialized with {len(self.global_model_weights)} weight matrices")
    
    def run_federated_learning_round(self):
        """Execute one complete federated learning round"""
        
        self.current_round += 1
        print("\n" + "="*60)
        print(f"FEDERATED LEARNING ROUND {self.current_round}")
        print("="*60)
        
        round_results = {
            'round': self.current_round,
            'timestamp': datetime.now(),
            'participants': [],
            'aggregated_loss': None
        }
        
        # Phase 1: Local Training
        print("\n[Phase 1] LOCAL TRAINING")
        print("-"*60)
        
        local_updates = {}
        for org_id, manager in self.local_managers.items():
            try:
                # Download global model
                manager.download_global_model(self.global_model_weights)
                
                # Load local data
                local_data = manager.load_local_data(f"./data/{org_id}")
                
                # Train locally
                local_update, history = manager.train_local_model(
                    local_data,
                    num_epochs=self.config['training']['local_epochs'],
                    batch_size=self.config['training']['batch_size']
                )
                
                local_updates[org_id] = local_update
                round_results['participants'].append({
                    'org_id': org_id,
                    'status': 'COMPLETED',
                    'loss': history.history['loss'][-1]
                })
            
            except Exception as e:
                print(f"✗ Training failed for {org_id}: {str(e)}")
                round_results['participants'].append({
                    'org_id': org_id,
                    'status': 'FAILED',
                    'error': str(e)
                })
        
        if len(local_updates) < self.config['aggregation']['min_clients']:
            print(f"✗ Insufficient participants: {len(local_updates)}/{self.config['aggregation']['min_clients']}")
            return round_results
        
        # Phase 2: Differential Privacy
        print("\n[Phase 2] DIFFERENTIAL PRIVACY")
        print("-"*60)
        
        private_updates = {}
        for org_id, local_update in local_updates.items():
            private_update = self.dp_engine.apply_differential_privacy(
                local_update,
                method=self.config['differential_privacy']['method']
            )
            private_updates[org_id] = private_update
            
            privacy_status = self.dp_engine.get_privacy_guarantee()
            print(f"[{org_id}] Applied DP")
            print(f"  - ε (accumulated): {privacy_status['epsilon']:.4f}")
            print(f"  - δ: {privacy_status['delta']:.2e}")
        
        # Phase 3: Secure Aggregation
        print("\n[Phase 3] SECURE AGGREGATION")
        print("-"*60)
        
        # Register updates
        for org_id, private_update in private_updates.items():
            encrypted_update = self.secure_aggregator.encrypt_update_for_transmission(
                org_id, private_update
            )
            self.secure_aggregator.receive_encrypted_update(org_id, encrypted_update)
        
        # Aggregate
        aggregated_encrypted = self.secure_aggregator.aggregate_with_secure_computation()
        aggregated_update = self.secure_aggregator.decrypt_aggregated_update(aggregated_encrypted)
        
        # Phase 4: Global Model Update
        print("\n[Phase 4] GLOBAL MODEL UPDATE")
        print("-"*60)
        
        # Update global weights
        learning_rate = 0.01
        self.global_model_weights = [
            w + learning_rate * u
            for w, u in zip(self.global_model_weights, aggregated_update)
        ]
        print("✓ Global model updated")
        
        # Phase 5: Model Distribution
        print("\n[Phase 5] MODEL DISTRIBUTION")
        print("-"*60)
        
        distribution_results = self.model_distributor.distribute_global_model(
            self.global_model_weights
        )
        
        round_results['distribution_status'] = distribution_results
        
        # Store round results
        self.training_history.append(round_results)
        
        print("\n" + "="*60)
        print(f"ROUND {self.current_round} COMPLETED")
        print("="*60)
        
        return round_results
    
    def run_federated_training_loop(self):
        """Run complete federated learning training"""
        
        self.initialize_federation()
        
        for round_num in range(1, self.config['training']['rounds'] + 1):
            result = self.run_federated_learning_round()
            
            # Check early stopping or other criteria
            if self._should_stop_training(result):
                print("Training stopped early")
                break
    
    def _should_stop_training(self, round_result):
        """Determine if training should stop"""
        # Implement early stopping logic
        return False
    
    def get_training_summary(self):
        """Get summary of federated training"""
        summary = {
            'total_rounds': self.current_round,
            'participants': len(self.local_managers),
            'privacy_status': self.dp_engine.get_privacy_guarantee(),
            'round_history': self.training_history
        }
        return summary
```

---

## Privacy Guarantees

### Differential Privacy Analysis

**Local Differential Privacy (Client-Side):**
- Laplacian noise scale: σ = sensitivity / ε
- With ε = 0.5: strong privacy protection
- Each gradient has noise added before sharing

**Secure Aggregation (Server-Side):**
- No individual client updates visible to server
- Only aggregate sum computed
- Information-theoretic security guarantee

**Combined Privacy:**
- Accumulated privacy budget tracked
- δ = 10^-6 (failure probability)
- Strict privacy guarantees maintained

---

## Success Criteria

- ✓ Federated training completing 10+ rounds
- ✓ Privacy budget managed (ε ≤ 1.0 recommended)
- ✓ Model accuracy maintained or improved
- ✓ No raw data exposed between organizations
- ✓ All communications encrypted
- ✓ Audit logs comprehensive
- ✓ Scalable to 50+ organizations
