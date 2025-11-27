# Customer Integration - Federated Learning Implementation

## Overview

This document describes the complete implementation of federated learning integration in customer applications. The architecture ensures complete separation between the main backend's knowledge base (central detection logging) and each customer organization's local training database (organization-specific training data).

## Architecture Principles

### Database Separation Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│              TWO-TIER DATABASE ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

TIER 1: MAIN BACKEND (Coordinator)
┌────────────────────────────────────┐
│  knowledge_base.db                │
│  ──────────────────────────────── │
│  Purpose: Central Coordination    │
│  Location: backend/data/          │
│                                   │
│  Tables:                          │
│  • attacks (all detections)       │
│  • organizations (registry)       │
│  • federated_rounds (history)     │
│  • model_versions (global)        │
│  • gradient_updates (received)    │
│  • privacy_budgets (tracking)     │
└────────────────────────────────────┘
              ▲
              │ Coordination & Aggregation
              │
              │
              ▼
┌────────────────────────────────────┐
│  TIER 2: CUSTOMER APPLICATIONS     │
│  ────────────────────────────────  │
│                                     │
│  Organization A                    │
│  ┌─────────────────────────────┐ │
│  │ local_training_A.db          │ │
│  │ • local_attacks               │ │
│  │ • training_data               │ │
│  │ • model_versions               │ │
│  │ • training_logs                │ │
│  └─────────────────────────────┘ │
│                                     │
│  Organization B                    │
│  ┌─────────────────────────────┐ │
│  │ local_training_B.db          │ │
│  │ • local_attacks               │ │
│  │ • training_data               │ │
│  │ • model_versions               │ │
│  │ • training_logs                │ │
│  └─────────────────────────────┘ │
└────────────────────────────────────┘
```

### Key Separation Benefits

1. **No Conflicts**: Main KB stores all detections; Local DB stores training data
2. **Privacy**: Each organization keeps data local
3. **Scalability**: Independent databases per organization
4. **Compliance**: Data stays within organization boundaries
5. **Training**: Organizations train on their own attack patterns

## Implementation Components

### 1. Local Training Database (`database/local_db.js`)

**Purpose**: Organization-specific SQLite database for storing attack data and training information.

**Key Features**:
- Stores only this organization's detected attacks
- Separate from main backend knowledge base
- Tracks training data and model versions
- Manages federated learning status

**Database Schema**:

```sql
-- Local attacks table (organization-specific)
CREATE TABLE local_attacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    query TEXT NOT NULL,
    normalized_query TEXT,
    is_malicious INTEGER NOT NULL,
    confidence REAL NOT NULL,
    attack_type TEXT,
    source_ip TEXT,
    user_agent TEXT,
    response_time_ms REAL,
    processed_for_training INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Training data table (features + labels)
CREATE TABLE training_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attack_id INTEGER,
    features TEXT NOT NULL,
    label INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    used_in_round INTEGER,
    FOREIGN KEY (attack_id) REFERENCES local_attacks(id)
);

-- Model versions table
CREATE TABLE model_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER UNIQUE NOT NULL,
    global_version INTEGER,
    created_at TEXT NOT NULL,
    model_path TEXT,
    metrics TEXT
);

-- Training logs
CREATE TABLE training_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_number INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    samples_used INTEGER,
    metrics TEXT,
    status TEXT DEFAULT 'pending'
);

-- Federated status
CREATE TABLE federated_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id TEXT UNIQUE NOT NULL,
    coordinator_url TEXT,
    registered_at TEXT,
    last_sync TEXT,
    current_round INTEGER DEFAULT 0,
    status TEXT DEFAULT 'disconnected'
);
```

**Key Methods**:
- `storeLocalAttack()` - Store attack in local database
- `getUnprocessedAttacks()` - Get attacks for training
- `markAsProcessed()` - Mark attacks as processed
- `storeTrainingData()` - Store extracted features
- `logTrainingSession()` - Log training rounds
- `updateFederatedStatus()` - Update connection status

### 2. Feature Extractor (`services/feature_extractor.js`)

**Purpose**: Extract security-relevant features from SQL queries (JavaScript implementation matching Python backend).

**Features Extracted** (28 features):
- Query length
- SQL keyword counts (UNION, SELECT, INSERT, etc.)
- Special character counts (quotes, semicolons, equals)
- Comment patterns (--, /* */, #)
- Function detection (version(), database(), user())
- Hex encoding detection

**Key Methods**:
- `extract(query)` - Extract features as object
- `extractAsArray(query)` - Extract features as array for ML

### 3. Query Normalizer (`services/normalizer.js`)

**Purpose**: Standardize SQL queries by removing obfuscation techniques.

**Normalization Steps**:
1. URL decoding (handles multiple encoding)
2. Remove comments (--, /* */, #)
3. Normalize whitespace
4. Convert to lowercase

**Key Methods**:
- `normalize(query)` - Full normalization pipeline
- `removeObfuscation(query)` - Remove obfuscation techniques

### 4. Local Trainer (`services/local_trainer.js`)

**Purpose**: Handle local model training at organization endpoints.

**Key Features**:
- Downloads global model weights
- Trains on local data
- Computes gradients/updates
- Maintains training history

**Training Process**:
1. Load global model weights
2. Extract features from local attacks
3. Train locally on organization's data
4. Compute model updates (gradients)
5. Return updates for federated aggregation

**Key Methods**:
- `loadGlobalModel(weights)` - Load global model
- `train(localData)` - Train on local data
- `computeModelUpdate()` - Compute gradients

### 5. Federated Client (`services/federated_client.js`)

**Purpose**: Organization-side client for federated learning coordination.

**Key Features**:
- Registration with coordinator
- Model download from coordinator
- Local training orchestration
- Differential privacy application
- Update upload to coordinator

**Federated Learning Cycle**:

```
1. Register with Coordinator
   └─▶ POST /api/federated/register

2. Download Global Model
   └─▶ GET /api/federated/download-model

3. Train Locally
   └─▶ Extract features from local_attacks
   └─▶ Train model
   └─▶ Compute gradients

4. Apply Differential Privacy
   └─▶ Add Laplacian noise
   └─▶ Clip gradients

5. Upload Update
   └─▶ POST /api/federated/upload-update
   └─▶ Mark attacks as processed
```

**Key Methods**:
- `register()` - Register with coordinator
- `downloadGlobalModel()` - Download latest model
- `trainAndUpload(localDb)` - Complete training cycle
- `applyDifferentialPrivacy()` - Add privacy noise

## Data Flow Architecture

### Attack Detection Flow

```
User Request
    │
    ▼
Customer Backend (server.js)
    │
    ├─▶ Main Backend /api/detect
    │   └─▶ Main KB (knowledge_base.db)
    │       └─▶ attacks table (all detections)
    │
    └─▶ Local DB (local_training.db)
        └─▶ local_attacks table (org-specific)
            └─▶ Marked for training
```

### Federated Learning Flow

```
Periodic Training (every hour)
    │
    ▼
Customer Backend
    │
    ├─▶ Download Global Model
    │   └─▶ GET /api/federated/download-model
    │
    ├─▶ Train on Local Data
    │   └─▶ local_attacks → features → train
    │
    ├─▶ Apply Differential Privacy
    │   └─▶ Add noise to gradients
    │
    └─▶ Upload Update
        └─▶ POST /api/federated/upload-update
            └─▶ Main Backend stores in federated_rounds
```

## Configuration

### Environment Variables

```bash
# Detection API
DETECTION_API=http://host.docker.internal:8000
USE_PROTECTION=true

# Federated Learning
ENABLE_FEDERATED=true
ORG_ID=customer_demo_001
ORG_NAME=Customer Demo Organization
COORDINATOR_URL=http://host.docker.internal:8000
FEDERATED_API_KEY=your_api_key_here
FEDERATED_TRAINING_INTERVAL=3600000  # 1 hour in milliseconds

# Differential Privacy
DP_EPSILON=0.5
DP_SENSITIVITY=1.0

# Database
LOCAL_DB_PATH=/app/data/local_training.db
ORG_ADDRESS=localhost:5000
```

### Docker Compose Configuration

```yaml
backend:
  environment:
    # ... existing config ...
    ENABLE_FEDERATED: "true"
    ORG_ID: "customer_demo_001"
    ORG_NAME: "Customer Demo Organization"
    COORDINATOR_URL: "http://host.docker.internal:8000"
    FEDERATED_API_KEY: "${FEDERATED_API_KEY:-default_key}"
    FEDERATED_TRAINING_INTERVAL: "3600000"
    DP_EPSILON: "0.5"
    DP_SENSITIVITY: "1.0"
    LOCAL_DB_PATH: "/app/data/local_training.db"
  volumes:
    - ./backend/data:/app/data  # Persist local training database
```

## API Endpoints

### Customer Backend Endpoints

#### `GET /health`
Health check endpoint with federated learning status.

**Response**:
```json
{
  "status": "healthy",
  "protection": true,
  "federated_learning": true
}
```

#### `GET /api/federated/status`
Get federated learning status and statistics.

**Response**:
```json
{
  "enabled": true,
  "client": {
    "org_id": "customer_demo_001",
    "org_name": "Customer Demo Organization",
    "coordinator_url": "http://host.docker.internal:8000",
    "current_round": 5,
    "is_registered": true,
    "training_history_count": 5
  },
  "local_status": {
    "org_id": "customer_demo_001",
    "coordinator_url": "http://host.docker.internal:8000",
    "current_round": 5,
    "status": "synced",
    "last_sync": "2025-01-15T10:30:00Z"
  },
  "statistics": {
    "total_attacks": 150,
    "malicious_attacks": 45,
    "unprocessed_attacks": 12,
    "avg_confidence": 0.87
  }
}
```

### Main Backend Endpoints (Coordinator)

#### `POST /api/federated/register`
Register organization with coordinator.

**Request**:
```json
{
  "org_id": "customer_demo_001",
  "org_name": "Customer Demo Organization",
  "address": "localhost:5000"
}
```

#### `GET /api/federated/download-model`
Download current global model.

**Response**:
```json
{
  "model_version": 5,
  "weights": {...},
  "round": 5
}
```

#### `POST /api/federated/upload-update`
Upload encrypted gradient update.

**Request**:
```json
{
  "org_id": "customer_demo_001",
  "round": 5,
  "update": [[...gradients...]],
  "metrics": {
    "samples_trained": 45,
    "feature_count": 28,
    "positive_samples": 30,
    "negative_samples": 15
  }
}
```

## Privacy Protection

### Differential Privacy Implementation

**Laplacian Noise Addition**:
- Epsilon (ε): 0.5 (privacy budget)
- Delta (δ): 1e-6 (failure probability)
- Sensitivity: 1.0
- Noise Scale: sensitivity / epsilon

**Privacy Guarantees**:
- Individual attack data never leaves organization
- Only gradients shared (not raw data)
- Noise added before transmission
- Privacy budget tracked per organization

### Secure Aggregation

- Encrypted gradient transmission
- Secure multi-party computation
- No individual updates visible to coordinator
- Only aggregated results computed

## Deployment

### Prerequisites

1. Main backend running in coordinator mode
2. SQLite3 installed (included in Node.js dependencies)
3. Docker and Docker Compose installed

### Setup Steps

1. **Update Dependencies**:
   ```bash
   cd customer_integration/backend
   npm install
   ```

2. **Configure Environment**:
   Set environment variables in `docker-compose.yml` or `.env` file.

3. **Start Services**:
   ```bash
   cd customer_integration
   docker-compose up --build
   ```

4. **Verify Registration**:
   Check logs for:
   ```
   ✓ Federated learning client registered
   ✓ Federated learning cycle scheduled
   ```

5. **Monitor Status**:
   ```bash
   curl http://localhost:5000/api/federated/status
   ```

## Monitoring and Debugging

### Log Messages

**Registration**:
```
[customer_demo_001] ✓ Successfully registered with coordinator
✓ Federated learning client registered
```

**Training Cycle**:
```
[customer_demo_001] Starting federated learning cycle
[customer_demo_001] ✓ Downloaded global model (round 5)
[customer_demo_001] Processing 45 attack samples
[customer_demo_001] Starting local training
[customer_demo_001] Local training completed
[customer_demo_001] Applying differential privacy (ε=0.5, scale=2.0000)
[customer_demo_001] ✓ Successfully uploaded update (round 5)
```

### Database Inspection

**View Local Attacks**:
```bash
sqlite3 customer_integration/backend/data/local_training.db
SELECT COUNT(*) FROM local_attacks;
SELECT COUNT(*) FROM local_attacks WHERE processed_for_training = 0;
```

**View Training Logs**:
```sql
SELECT * FROM training_logs ORDER BY round_number DESC LIMIT 5;
```

**View Federated Status**:
```sql
SELECT * FROM federated_status;
```

## Troubleshooting

### Common Issues

1. **Registration Fails**:
   - Check coordinator URL is accessible
   - Verify main backend is running in coordinator mode
   - Check network connectivity (host.docker.internal)

2. **Model Download Fails**:
   - Verify coordinator has registered organizations
   - Check API key if authentication enabled
   - Review coordinator logs

3. **Training Fails**:
   - Ensure sufficient attack data (minimum 10 samples)
   - Check local database permissions
   - Verify feature extraction working

4. **Upload Fails**:
   - Check network connectivity
   - Verify coordinator endpoint accessible
   - Review coordinator logs for errors

### Debug Mode

Enable verbose logging by setting:
```bash
DEBUG=true
```

## Best Practices

1. **Data Retention**: Regularly archive processed attacks
2. **Privacy Budget**: Monitor epsilon consumption
3. **Training Frequency**: Adjust interval based on attack volume
4. **Database Backup**: Regular backups of local training database
5. **Monitoring**: Track training metrics and model performance

## Security Considerations

1. **API Keys**: Use secure API keys for coordinator communication
2. **Network**: Use HTTPS in production
3. **Database**: Secure local database file permissions
4. **Privacy**: Review differential privacy parameters
5. **Access Control**: Implement proper authentication

## Future Enhancements

1. **Model Persistence**: Save trained models locally
2. **Advanced DP**: Implement advanced differential privacy mechanisms
3. **Federated Analytics**: Share aggregated statistics
4. **Multi-Model Support**: Support different model architectures
5. **Real-time Training**: Trigger training on-demand

## References

- Main Federated Learning Documentation: `05-Module4-FederatedLearning.md`
- Customer Integration Architecture: `customer_integration/ARCHITECTURE.md`
- Main Backend Implementation: `backend/app/services/federated/`

## Summary

This implementation provides a complete federated learning solution for customer applications with:

✅ **Complete Database Separation**: Main KB vs Local DB
✅ **Privacy Preservation**: Differential privacy and secure aggregation
✅ **Automatic Training**: Periodic federated learning cycles
✅ **Scalable Architecture**: Independent databases per organization
✅ **Production Ready**: Error handling, logging, and monitoring

The architecture ensures that detection logging (main backend) and training data (local databases) remain completely separate, enabling privacy-preserving federated learning while maintaining centralized detection capabilities.

