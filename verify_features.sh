#!/bin/bash

# Feature Verification Script
# Verifies all promised features are implemented

echo "=========================================="
echo "SQL Injection Detection System"
echo "Feature Verification Script"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $2 (Missing: $1)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

check_dir() {
    TOTAL=$((TOTAL + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $2 (Missing: $1)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "Module 1: Data Collection & Training"
echo "--------------------------------------"
check_file "backend/data_generator.py" "Data Generator"
check_file "backend/train_model.py" "Model Training Script"
check_file "backend/app/services/feature_extractor.py" "Feature Extractor"
echo ""

echo "Module 2: Detection Engine"
echo "--------------------------------------"
check_file "backend/app/services/normalizer.py" "Query Normalizer"
check_file "backend/app/services/feature_extractor.py" "Feature Extractor"
check_file "backend/app/services/ml_detector.py" "ML Detector"
check_file "backend/app/api/routes.py" "Detection API Routes"
echo ""

echo "Module 3: Knowledge Base"
echo "--------------------------------------"
check_file "backend/app/database/schema.py" "Database Schema"
check_file "backend/app/services/knowledge_base.py" "Knowledge Base Service"
check_file "backend/data/knowledge_base.db" "SQLite Database"
echo ""

echo "Module 4: Federated Learning"
echo "--------------------------------------"
check_file "backend/app/services/federated/coordinator.py" "FL Coordinator"
check_file "backend/app/services/federated/client.py" "FL Client"
check_file "backend/app/services/federated/local_trainer.py" "Local Trainer"
check_file "backend/app/services/federated/secure_aggregator.py" "Secure Aggregator"
check_file "backend/app/services/federated/differential_privacy.py" "Differential Privacy"
check_file "backend/app/services/federated/distributor.py" "Model Distributor"
check_file "backend/app/api/federated_routes.py" "Federated API Routes"
check_file "backend/app/database/federated_schema.py" "Federated DB Schema"
echo ""

echo "Additional Features"
echo "--------------------------------------"
check_file "backend/app/services/honeypot/service.py" "Honeypot Service"
check_file "backend/app/services/proxy/service.py" "Proxy Service"
check_file "backend/app/services/proxy/detection.py" "Proxy Detection"
echo ""

echo "Frontend Components"
echo "--------------------------------------"
check_file "frontend/src/App.jsx" "Main Application"
check_file "frontend/src/components/Dashboard.jsx" "Dashboard Component"
check_file "frontend/src/components/QueryTester.jsx" "Query Tester Component"
check_file "frontend/src/components/Analytics.jsx" "Analytics Component"
check_file "frontend/src/services/api.js" "API Service"
check_file "frontend/src/services/websocket.js" "WebSocket Service"
echo ""

echo "Deployment Configuration"
echo "--------------------------------------"
check_file "docker-compose.yml" "Docker Compose (Standalone)"
check_file "docker-compose.coordinator.yml" "Docker Compose (Coordinator)"
check_file "docker-compose.organization.yml" "Docker Compose (Organization)"
check_file "backend/Dockerfile" "Dockerfile (Standard)"
check_file "backend/Dockerfile.coordinator" "Dockerfile (Coordinator)"
check_file "backend/Dockerfile.organization" "Dockerfile (Organization)"
check_file "backend/config/coordinator.env" "Coordinator Config"
check_file "backend/config/organization.env" "Organization Config"
echo ""

echo "Documentation"
echo "--------------------------------------"
check_file "README.md" "README"
check_file "PROJECT_REPORT.md" "Project Report"
check_file "DEPLOYMENT_GUIDE.md" "Deployment Guide"
check_file "TEST_REPORT.md" "Test Report"
check_file "FEATURE_COMPLIANCE_REPORT.md" "Feature Compliance Report"
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "Total Checks: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

PERCENTAGE=$((PASSED * 100 / TOTAL))
echo -e "Compliance: ${PERCENTAGE}%"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL FEATURES VERIFIED${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some features missing${NC}"
    exit 1
fi
