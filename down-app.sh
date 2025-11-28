#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping all application services..."
docker compose -f docker-compose.coordinator.yml down
docker compose -f docker-compose.organization.yml down
docker compose -f docker-compose.frontend.yml down

echo "All application services stopped."
