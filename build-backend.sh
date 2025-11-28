#!/bin/bash

# Build and Start Script for Coordinator & Organization Services
# Workaround for Docker Compose v2.40.3 build bug

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Building Coordinator & Organization Images"
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

echo ""
echo "=========================================="
echo "Starting containers with docker compose..."
echo "=========================================="

# Use original compose files with --no-build flag to avoid the build parsing bug
# Images are already built manually above
docker compose -f docker-compose.coordinator.yml up -d --no-build
docker compose -f docker-compose.organization.yml up -d --no-build

echo ""
echo "=========================================="
echo "Container Status:"
echo "=========================================="
docker ps | grep sqli || echo "No sqli containers found"

echo ""
echo "Done! Coordinator and Organization services are running."
echo ""
echo "Useful commands:"
echo "  View logs: docker logs sqli-coordinator -f"
echo "  View logs: docker logs sqli-organization -f"
echo "  Stop: docker compose -f docker-compose.coordinator.yml down"
echo "  Stop: docker compose -f docker-compose.organization.yml down"

