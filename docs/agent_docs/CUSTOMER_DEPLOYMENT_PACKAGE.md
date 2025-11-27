# Customer Deployment Package Guide

## What Your Application Includes

Your SQL Injection Detection System consists of:
1. **Backend API** (FastAPI/Python) - Detection engine, ML model, database
2. **Frontend Dashboard** (React) - Web interface for monitoring and management
3. **ML Model** - Pre-trained Random Forest classifier
4. **Database** - SQLite for knowledge base

## Deployment Options for Customers

### Option 1: Docker Deployment (RECOMMENDED)
**Best for:** Production environments, easy deployment, scalability

**What to provide:**
```
sql-injection-detection-system/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   └── data/ (with trained model)
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── DEPLOYMENT_INSTRUCTIONS.md
```

**Customer runs:**
```bash
docker-compose up -d
```

### Option 2: Manual Installation
**Best for:** Development, customization, on-premise servers

**What to provide:**
- Source code (backend + frontend)
- Installation guide
- Requirements files
- Pre-trained model

### Option 3: Cloud Deployment (AWS/Azure/GCP)
**Best for:** Enterprise customers, high availability

**What to provide:**
- Docker images
- Kubernetes manifests
- Terraform/CloudFormation templates
- Deployment guide

### Option 4: Standalone Executable (Future)
**Best for:** Desktop applications, offline use

**What to provide:**
- Packaged executable (PyInstaller + Electron)
- Installation wizard
- User manual

## What to Package for Customers

### 1. Core Application Files

```bash
# Create deployment package
mkdir sql-injection-detection-system
cd sql-injection-detection-system

# Copy essential files
cp -r backend/ .
cp -r frontend/ .
cp docker-compose.yml .
cp README.md .
```

### 2. Pre-trained Model
```bash
# Ensure model is trained and included
backend/app/models/rf_detector.pkl
```

### 3. Configuration Files
```bash
backend/config/
├── coordinator.env
└── organization.env
```

### 4. Documentation
```bash
docs/
├── INSTALLATION.md
├── USER_GUIDE.md
├── API_DOCUMENTATION.md
└── TROUBLESHOOTING.md
```

### 5. Docker Files (Recommended)
```bash
docker-compose.yml
backend/Dockerfile
frontend/Dockerfile
```

## Deployment Package Creation Script

Create this script to automate packaging:

```bash
#!/bin/bash
# package_for_customer.sh

VERSION="1.0.0"
PACKAGE_NAME="sql-injection-detection-v${VERSION}"

echo "Creating customer deployment package..."

# Create package directory
mkdir -p ${PACKAGE_NAME}

# Copy application files
cp -r backend ${PACKAGE_NAME}/
cp -r frontend ${PACKAGE_NAME}/
cp docker-compose.yml ${PACKAGE_NAME}/
cp README.md ${PACKAGE_NAME}/

# Copy documentation
mkdir -p ${PACKAGE_NAME}/docs
cp docs/agent_docs/DEPLOYMENT_GUIDE.md ${PACKAGE_NAME}/docs/
cp docs/agent_docs/QUICK_REFERENCE.md ${PACKAGE_NAME}/docs/

# Clean up unnecessary files
rm -rf ${PACKAGE_NAME}/backend/venv
rm -rf ${PACKAGE_NAME}/backend/__pycache__
rm -rf ${PACKAGE_NAME}/frontend/node_modules
rm -rf ${PACKAGE_NAME}/backend/data/knowledge_base.db

# Create archive
tar -czf ${PACKAGE_NAME}.tar.gz ${PACKAGE_NAME}
zip -r ${PACKAGE_NAME}.zip ${PACKAGE_NAME}

echo "Package created: ${PACKAGE_NAME}.tar.gz and ${PACKAGE_NAME}.zip"
```

## Customer Installation Instructions

### Docker Deployment (Simplest)

**Prerequisites:**
- Docker installed
- Docker Compose installed

**Steps:**
```bash
# 1. Extract package
tar -xzf sql-injection-detection-v1.0.0.tar.gz
cd sql-injection-detection-v1.0.0

# 2. Start services
docker-compose up -d

# 3. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Installation

**Prerequisites:**
- Python 3.8+
- Node.js 16+
- npm or yarn

**Backend Setup:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_model.py  # If model not included
python main.py
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

## What Customers Need

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 10GB
- **OS:** Linux, macOS, or Windows
- **Network:** Internet connection (for updates)

### Software Requirements
- Docker & Docker Compose (for Docker deployment)
- OR Python 3.8+ and Node.js 16+ (for manual installation)

## Licensing & Distribution

### Files to Include
1. **LICENSE** - Your software license
2. **TERMS_OF_SERVICE.md** - Usage terms
3. **PRIVACY_POLICY.md** - Data handling policy
4. **SUPPORT.md** - Support contact information

### What NOT to Include
- Development files (`.git`, `__pycache__`, `node_modules`)
- Test files
- Personal configuration
- Development databases with test data
- API keys or secrets

## Support & Maintenance

### Provide to Customers
1. **Installation Support**
   - Email: support@yourcompany.com
   - Documentation: docs/
   - Video tutorials (optional)

2. **Updates**
   - Version update instructions
   - Migration guides
   - Changelog

3. **Monitoring**
   - Health check endpoint: `/health`
   - System monitor dashboard
   - Log files location

## Pricing Models

### Option 1: One-Time License
- Single payment
- Includes all features
- 1 year of updates

### Option 2: Subscription
- Monthly/Annual fee
- Continuous updates
- Priority support

### Option 3: Enterprise
- Custom deployment
- Dedicated support
- SLA guarantees
- Custom features

## Delivery Methods

### 1. Download Link
- Host on your server
- Provide download credentials
- Include checksum for verification

### 2. Docker Registry
- Push to Docker Hub or private registry
- Customer pulls images
- Easy updates

### 3. Cloud Marketplace
- AWS Marketplace
- Azure Marketplace
- Google Cloud Marketplace

### 4. Physical Media (Enterprise)
- USB drive
- DVD
- Includes offline documentation

## Customer Onboarding Checklist

- [ ] Package application files
- [ ] Include pre-trained model
- [ ] Write installation guide
- [ ] Create quick start guide
- [ ] Prepare API documentation
- [ ] Set up support channel
- [ ] Create demo video
- [ ] Prepare training materials
- [ ] Test deployment on clean system
- [ ] Create troubleshooting guide

## Post-Deployment Support

### What to Monitor
1. Customer deployment success rate
2. Common installation issues
3. Feature usage statistics
4. Performance metrics
5. Support ticket trends

### Regular Updates
- Security patches
- Model improvements
- New features
- Bug fixes
- Documentation updates

## Example Customer Package Structure

```
sql-injection-detection-v1.0.0/
├── README.md                    # Quick overview
├── LICENSE                      # Software license
├── docker-compose.yml           # Docker deployment
├── INSTALLATION.md              # Detailed setup
├── CHANGELOG.md                 # Version history
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   │   └── rf_detector.pkl  # Pre-trained model
│   │   └── database/
│   └── config/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   └── public/
├── docs/
│   ├── USER_GUIDE.md
│   ├── API_REFERENCE.md
│   ├── TROUBLESHOOTING.md
│   └── ARCHITECTURE.md
└── scripts/
    ├── start.sh                 # Quick start script
    ├── stop.sh                  # Stop script
    └── backup.sh                # Backup script
```

## Quick Commands for Customers

```bash
# Start application
./scripts/start.sh

# Stop application
./scripts/stop.sh

# View logs
docker-compose logs -f

# Backup data
./scripts/backup.sh

# Update to new version
docker-compose pull
docker-compose up -d
```

---

**Next Steps:**
1. Run the packaging script
2. Test deployment on clean system
3. Create customer documentation
4. Set up support infrastructure
5. Prepare demo/training materials
