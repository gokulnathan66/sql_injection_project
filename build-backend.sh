#!/bin/bash

# Build and Start Script for All Services
# Workaround for Docker Compose v2.40.3 build bug

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Building All Application Images"
echo "=========================================="

# Build coordinator image
echo "Building coordinator image..."
cd backend
docker build --platform linux/amd64 -f Dockerfile.coordinator -t sqli-coordinator:latest .
cd "$SCRIPT_DIR"

# Build organization image
echo "Building organization image..."
cd backend
docker build --platform linux/amd64 -f Dockerfile.organization -t sqli-organization:latest .
cd "$SCRIPT_DIR"

# Build frontend image
echo "Building frontend image..."
cd frontend
docker build --platform linux/amd64 -t sqli-frontend:latest .
cd "$SCRIPT_DIR"

echo ""
echo "=========================================="
echo "Starting containers with docker compose..."
echo "=========================================="

# Use original compose files with --no-build flag to avoid the build parsing bug
# Images are already built manually above
docker compose -f docker-compose.coordinator.yml up -d --no-build
docker compose -f docker-compose.organization.yml up -d --no-build
docker compose -f docker-compose.frontend.yml up -d --no-build

echo ""
echo "=========================================="
echo "Container Status:"
echo "=========================================="
docker ps | grep sqli || echo "No sqli containers found"

echo ""
echo "Done! All services are running."
echo ""
echo "Services:"
echo "  - Coordinator API: http://localhost:8000"
echo "  - Coordinator Honeypot: http://localhost:9000"
echo "  - Organization API: http://localhost:8001"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  View coordinator logs: docker logs sqli-coordinator -f"
echo "  View organization logs: docker logs sqli-organization -f"
echo "  View frontend logs: docker logs sqli-frontend -f"
echo "  Stop all: ./down-app.sh"

