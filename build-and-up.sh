#!/bin/bash

# Workaround script for Docker Compose v2.40.3 build bug
# This script builds images manually first, then uses docker compose to start them

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Docker images manually (workaround for Docker Compose v2.40.3 bug)..."

# Build coordinator image
echo "Building coordinator image..."
cd backend
docker build -f Dockerfile.coordinator -t sqli-coordinator:latest .
cd "$SCRIPT_DIR"

# Build organization image
echo "Building organization image..."
cd backend
docker build -f Dockerfile.organization -t sqli-organization:latest .
cd "$SCRIPT_DIR"

echo "Images built successfully. Starting containers with docker compose..."

# Use compose files without build sections to avoid the bug
docker compose -f docker-compose.coordinator.no-build.yml up -d
docker compose -f docker-compose.organization.no-build.yml up -d

echo "Done! Containers should be running."
docker ps | grep sqli

