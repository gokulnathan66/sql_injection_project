#!/bin/bash

# Quick connection check script for customer integration

echo "=========================================="
echo "Customer Integration Connection Check"
echo "=========================================="
echo ""

# Check if containers are running
echo "1. Checking container status..."
docker ps | grep customer || echo "   ❌ No customer containers running"
echo ""

# Check backend health
echo "2. Checking backend health..."
BACKEND_HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null || echo "FAILED")
if [ "$BACKEND_HEALTH" != "FAILED" ]; then
  echo "   ✅ Backend is healthy: $BACKEND_HEALTH"
else
  echo "   ❌ Backend is not responding"
fi
echo ""

# Check frontend accessibility
echo "3. Checking frontend accessibility..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   ✅ Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
  echo "   ❌ Frontend returned HTTP $FRONTEND_STATUS"
fi
echo ""

# Get EC2 public IP if available
echo "4. Network information..."
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "Not detected")
if [ "$EC2_IP" != "Not detected" ]; then
  echo "   EC2 Public IP: $EC2_IP"
  echo "   Frontend URL: http://$EC2_IP:3001"
  echo "   Backend API URL: http://$EC2_IP:5000"
  echo ""
  echo "   ⚠️  IMPORTANT: When accessing frontend via $EC2_IP:3001"
  echo "      The frontend should auto-detect and connect to $EC2_IP:5000"
else
  echo "   Running locally (not on EC2)"
  echo "   Frontend URL: http://localhost:3001"
  echo "   Backend API URL: http://localhost:5000"
fi
echo ""

# Check backend logs for errors
echo "5. Recent backend logs (last 5 lines)..."
docker logs customer_backend --tail 5 2>/dev/null || echo "   Could not fetch backend logs"
echo ""

# Check frontend logs for errors
echo "6. Recent frontend logs (last 5 lines)..."
docker logs customer_frontend --tail 5 2>/dev/null || echo "   Could not fetch frontend logs"
echo ""

echo "=========================================="
echo "Troubleshooting Tips:"
echo "=========================================="
echo "1. If frontend shows 'Failed to connect to server':"
echo "   - Open browser console (F12) and check for 'Auto-detected API URL' message"
echo "   - Verify the API URL matches your EC2 IP address"
echo "   - Make sure backend is running: docker logs customer_backend"
echo ""
echo "2. To rebuild frontend with latest fixes:"
echo "   cd customer_integration"
echo "   ./build-customer.sh"
echo ""
echo "3. To check if backend is accessible from browser:"
echo "   curl http://<EC2_IP>:5000/health"
echo ""

