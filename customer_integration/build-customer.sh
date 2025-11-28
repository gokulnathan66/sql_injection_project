#!/bin/bash

# Build and Start Script for Customer Integration Services
# Workaround for Docker Compose v2.40.3 build bug

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Building Customer Integration Images"
echo "=========================================="

# Build backend image
echo "Building customer backend image..."
cd backend
docker build --platform linux/amd64 -t customer_backend:latest .
cd "$SCRIPT_DIR"

# Build frontend image
echo "Building customer frontend image..."
echo "Note: Frontend will auto-detect API URL from browser hostname (port 5000)"
cd frontend
docker build --platform linux/amd64 -t customer_frontend:latest .
cd "$SCRIPT_DIR"

echo ""
echo "=========================================="
echo "Starting containers with docker compose..."
echo "=========================================="

# Use compose file without build sections to avoid the bug
docker compose -f docker-compose.no-build.yml up -d

echo ""
echo "=========================================="
echo "Container Status:"
echo "=========================================="
docker ps | grep customer || echo "No customer containers found"

echo ""
echo "Done! Customer integration services are running."
echo ""
echo "Services:"
echo "  - Database: localhost:5433"
echo "  - Backend API: http://localhost:5000"
echo "  - Frontend: http://localhost:3001"
echo ""
echo "IMPORTANT: Frontend auto-detects API URL from browser hostname"
echo "  - Access via localhost: Frontend connects to http://localhost:5000"
echo "  - Access via EC2 IP: Frontend connects to http://<EC2_IP>:5000"
echo ""
echo "Useful commands:"
echo "  View backend logs: docker logs customer_backend -f"
echo "  View frontend logs: docker logs customer_frontend -f"
echo "  View database logs: docker logs customer_database -f"
echo "  Stop all: docker compose -f docker-compose.no-build.yml down"
echo ""
echo "To troubleshoot frontend connection:"
echo "  1. Open browser console (F12)"
echo "  2. Check for 'Auto-detected API URL' log message"
echo "  3. Verify it matches your EC2 IP address"

