#!/bin/bash

# Workaround script for Docker Compose v2.40.3 build bug
# This script builds images manually first, then uses docker compose to start them

set -e

echo "Building Docker images manually (workaround for Docker Compose v2.40.3 bug)..."

# Build coordinator image
echo "Building coordinator image..."
cd backend
docker build -f Dockerfile.coordinator -t sqli-coordinator:latest .
cd ..

# Build organization image
echo "Building organization image..."
cd backend
docker build -f Dockerfile.organization -t sqli-organization:latest .
cd ..

echo "Images built successfully. Starting containers with docker compose..."

# Now use docker compose to start containers (it will use the pre-built images)
docker compose -f docker-compose.coordinator.yml up -d
docker compose -f docker-compose.organization.yml up -d

echo "Done! Containers should be running."
docker ps | grep sqli

