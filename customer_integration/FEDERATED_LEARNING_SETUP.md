# Federated Learning Setup Guide

## Quick Start

### 1. Prerequisites

Ensure the main backend is running in coordinator mode:
```bash
cd backend
APP_MODE=coordinator python -m app.main
```

### 2. Start Customer Integration

```bash
cd customer_integration
docker-compose up --build
```

### 3. Verify Setup

Check federated learning status:
```bash
curl http://localhost:5000/api/federated/status
```

## Configuration

### Environment Variables

Edit `docker-compose.yml` or create `.env` file:

```bash
# Organization Identity
ORG_ID=customer_demo_001
ORG_NAME=Customer Demo Organization

# Coordinator Connection
COORDINATOR_URL=http://host.docker.internal:8000
FEDERATED_API_KEY=your_api_key_here

# Training Configuration
FEDERATED_TRAINING_INTERVAL=3600000  # 1 hour
ENABLE_FEDERATED=true

# Privacy Settings
DP_EPSILON=0.5
DP_SENSITIVITY=1.0
```

## File Structure

```
customer_integration/backend/
├── database/
│   └── local_db.js              # Local training database
├── services/
│   ├── federated_client.js      # Federated learning client
│   ├── local_trainer.js         # Local training manager
│   ├── feature_extractor.js     # Feature extraction
│   └── normalizer.js            # Query normalization
├── data/
│   └── local_training.db       # SQLite database (auto-created)
├── server.js                    # Main server (updated)
└── package.json                 # Dependencies (updated)
```

## How It Works

1. **Attack Detection**: Every detected attack is stored in:
   - Main backend knowledge base (all organizations)
   - Local database (this organization only)

2. **Federated Learning Cycle** (runs every hour):
   - Download global model from coordinator
   - Train on local attack data
   - Apply differential privacy
   - Upload gradients to coordinator

3. **Database Separation**:
   - Main KB: Central detection logging
   - Local DB: Organization training data

## Monitoring

### Check Status
```bash
curl http://localhost:5000/api/federated/status
```

### View Local Database
```bash
sqlite3 backend/data/local_training.db
```

### Check Logs
```bash
docker logs customer_backend
```

## Troubleshooting

### Registration Issues
- Verify coordinator URL is accessible
- Check main backend is in coordinator mode
- Review network connectivity

### Training Issues
- Ensure minimum 10 attack samples
- Check database permissions
- Verify feature extraction working

## Documentation

Full documentation: `knowledges/08-CustomerIntegration-FederatedLearning.md`

