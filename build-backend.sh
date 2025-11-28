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

# Use compose files without build sections to avoid the bug
docker compose -f docker-compose.coordinator.no-build.yml up -d
docker compose -f docker-compose.organization.no-build.yml up -d

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
echo "  Stop: docker compose -f docker-compose.coordinator.no-build.yml down"
echo "  Stop: docker compose -f docker-compose.organization.no-build.yml down"

