#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping customer integration services..."
docker compose -f docker-compose.no-build.yml down

echo "Customer integration services stopped."
