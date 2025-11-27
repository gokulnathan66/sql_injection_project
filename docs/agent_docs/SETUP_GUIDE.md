# Quick Setup Guide

## Step-by-Step Installation

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate dataset and train model
python train_model.py

# Start backend server
python main.py
```

✅ Backend running at http://localhost:8000

### 2. Frontend Setup (3 minutes)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at http://localhost:3000

### 3. Test the System

1. Open http://localhost:3000 in your browser
2. Go to "Query Tester" tab
3. Click on a malicious example query
4. Click "Detect Injection"
5. See the results!

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError`
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Problem**: Model not found
```bash
# Train the model first
python train_model.py
```

**Problem**: Port 8000 already in use
```bash
# Change port in backend/main.py
# Line: uvicorn.run(..., port=8001)
```

### Frontend Issues

**Problem**: `npm install` fails
```bash
# Clear cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Port 3000 already in use
```bash
# Vite will automatically use next available port
# Or change in vite.config.js
```

**Problem**: Cannot connect to backend
```bash
# Make sure backend is running on port 8000
# Check frontend/vite.config.js proxy settings
```

## Verification Checklist

- [ ] Backend server running (http://localhost:8000)
- [ ] Backend API docs accessible (http://localhost:8000/docs)
- [ ] Frontend running (http://localhost:3000)
- [ ] Can navigate between tabs
- [ ] Can test queries in Query Tester
- [ ] Dashboard shows statistics
- [ ] Analytics shows charts

## Next Steps

1. Try different SQL injection examples
2. View real-time alerts on Dashboard
3. Explore Analytics for patterns
4. Check API documentation at http://localhost:8000/docs
5. Review the code to understand the implementation

## Performance Tips

- First query might be slower (model loading)
- Subsequent queries should be <50ms
- WebSocket connects automatically
- Data refreshes every 10-30 seconds

## Need Help?

- Check README.md for detailed documentation
- Review backend logs for errors
- Check browser console for frontend errors
- Ensure Python 3.8+ and Node.js 16+ are installed

