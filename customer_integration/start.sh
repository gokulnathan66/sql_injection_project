#!/bin/bash

echo "=================================================="
echo "  SQL Injection Detection - Customer Integration"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🚀 Starting services..."
echo ""

# Start services
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "=================================================="
echo "  ✅ Services Started Successfully!"
echo "=================================================="
echo ""
echo "📱 Access Points:"
echo "  • Vulnerable Banking App:  http://localhost:3001"
echo "  • Backend API:             http://localhost:5000"
echo "  • Detection System:        http://localhost:8000"
echo "  • Detection Dashboard:     http://localhost:3000"
echo "  • PostgreSQL:              localhost:5433"
echo ""
echo "📚 Documentation:"
echo "  • README:                  ./README.md"
echo "  • Testing Guide:           ./TESTING_GUIDE.md"
echo ""
echo "🔧 Useful Commands:"
echo "  • View logs:               docker-compose logs -f"
echo "  • Stop services:           docker-compose down"
echo "  • Restart:                 docker-compose restart"
echo ""
echo "🎯 Quick Test:"
echo "  1. Open http://localhost:3001"
echo "  2. Try SQL injection: admin' OR '1'='1'--"
echo "  3. View detection at http://localhost:3000"
echo ""
echo "=================================================="
