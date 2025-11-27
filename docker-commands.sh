#!/bin/bash

# Docker Commands for SQL Injection Detection System

# Navigate to project directory
cd /Users/gokulnathanb/Projects/mine/sql-injection-final-year-project

# ============================================
# COORDINATOR & ORGANIZATION CONTAINERS
# ============================================

# Stop containers
echo "Stopping containers..."
docker-compose -f docker-compose.coordinator.yml down
docker-compose -f docker-compose.organization.yml down

# Build and start containers
echo "Building and starting containers..."
docker-compose -f docker-compose.coordinator.yml up -d --build
docker-compose -f docker-compose.organization.yml up -d --build

# Restart containers (without rebuild)
echo "Restarting containers..."
docker-compose -f docker-compose.coordinator.yml restart
docker-compose -f docker-compose.organization.yml restart

# View logs
echo "Viewing logs..."
docker logs sqli-coordinator -f
docker logs sqli-organization -f

# Check status
echo "Checking status..."
docker ps | grep sqli

# ============================================
# CUSTOMER INTEGRATION CONTAINERS
# ============================================

# Navigate to customer integration
cd customer_integration

# Stop customer containers
echo "Stopping customer containers..."
docker-compose down

# Build and start customer containers
echo "Building and starting customer containers..."
docker-compose up -d --build

# Restart customer containers
echo "Restarting customer containers..."
docker-compose restart

# View customer logs
echo "Viewing customer logs..."
docker logs customer_backend -f
docker logs customer_frontend -f
docker logs customer_database -f

# ============================================
# ALL CONTAINERS
# ============================================

# Stop all project containers
echo "Stopping all containers..."
cd /Users/gokulnathanb/Projects/mine/sql-injection-final-year-project
docker-compose -f docker-compose.coordinator.yml down
docker-compose -f docker-compose.organization.yml down
cd customer_integration
docker-compose down

# Start all containers
echo "Starting all containers..."
cd /Users/gokulnathanb/Projects/mine/sql-injection-final-year-project
docker-compose -f docker-compose.coordinator.yml up -d --build
docker-compose -f docker-compose.organization.yml up -d --build
cd customer_integration
docker-compose up -d --build

# View all container status
echo "All containers status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ============================================
# USEFUL COMMANDS
# ============================================

# Remove all stopped containers
docker container prune -f

# Remove all unused images
docker image prune -a -f

# Remove all volumes
docker volume prune -f

# Complete cleanup
docker system prune -a --volumes -f
