#!/bin/bash

VERSION="1.0.0"
PACKAGE_NAME="sql-injection-detection-v${VERSION}"

echo "================================================"
echo "Creating Customer Deployment Package"
echo "Version: ${VERSION}"
echo "================================================"

# Create package directory
echo "Creating package directory..."
mkdir -p ${PACKAGE_NAME}

# Copy backend
echo "Copying backend..."
cp -r backend ${PACKAGE_NAME}/
rm -rf ${PACKAGE_NAME}/backend/venv
rm -rf ${PACKAGE_NAME}/backend/__pycache__
rm -rf ${PACKAGE_NAME}/backend/app/__pycache__
rm -rf ${PACKAGE_NAME}/backend/data/knowledge_base.db

# Copy frontend
echo "Copying frontend..."
cp -r frontend ${PACKAGE_NAME}/
rm -rf ${PACKAGE_NAME}/frontend/node_modules
rm -rf ${PACKAGE_NAME}/frontend/dist

# Copy Docker files
echo "Copying Docker configuration..."
cp docker-compose.yml ${PACKAGE_NAME}/

# Copy documentation
echo "Copying documentation..."
mkdir -p ${PACKAGE_NAME}/docs
cp README.md ${PACKAGE_NAME}/
cp docs/agent_docs/DEPLOYMENT_GUIDE.md ${PACKAGE_NAME}/docs/ 2>/dev/null || true
cp docs/agent_docs/QUICK_REFERENCE.md ${PACKAGE_NAME}/docs/ 2>/dev/null || true

# Create installation script
echo "Creating installation scripts..."
cat > ${PACKAGE_NAME}/install.sh << 'EOF'
#!/bin/bash
echo "SQL Injection Detection System - Installation"
echo "=============================================="

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "Docker detected. Starting with Docker..."
    docker-compose up -d
    echo ""
    echo "Installation complete!"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "API Docs: http://localhost:8000/docs"
else
    echo "Docker not found. Please install Docker and Docker Compose."
    echo "Or follow manual installation in docs/DEPLOYMENT_GUIDE.md"
fi
EOF

chmod +x ${PACKAGE_NAME}/install.sh

# Create README for package
cat > ${PACKAGE_NAME}/QUICK_START.md << 'EOF'
# SQL Injection Detection System - Quick Start

## Installation

### Option 1: Docker (Recommended)
```bash
./install.sh
```

### Option 2: Manual Installation

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_model.py
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Support

For detailed documentation, see the `docs/` directory.
EOF

# Create archive
echo "Creating archives..."
tar -czf ${PACKAGE_NAME}.tar.gz ${PACKAGE_NAME}
zip -rq ${PACKAGE_NAME}.zip ${PACKAGE_NAME}

# Calculate sizes
TAR_SIZE=$(du -h ${PACKAGE_NAME}.tar.gz | cut -f1)
ZIP_SIZE=$(du -h ${PACKAGE_NAME}.zip | cut -f1)

echo ""
echo "================================================"
echo "Package created successfully!"
echo "================================================"
echo "Files created:"
echo "  - ${PACKAGE_NAME}.tar.gz (${TAR_SIZE})"
echo "  - ${PACKAGE_NAME}.zip (${ZIP_SIZE})"
echo ""
echo "Package contents:"
ls -lh ${PACKAGE_NAME}/
echo ""
echo "To test the package:"
echo "  tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "  cd ${PACKAGE_NAME}"
echo "  ./install.sh"
echo "================================================"
