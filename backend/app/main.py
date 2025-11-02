"""
FastAPI Main Application
SQL Injection Detection System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .api.routes import router, database
from .services.ml_detector import MLDetector

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("Starting SQL Injection Detection System...")
    
    # Initialize database
    await database.initialize()
    print("✓ Database initialized")
    
    # Load ML model
    try:
        ml_detector = MLDetector(model_path='backend/app/models/rf_detector.pkl')
        print("✓ ML model loaded")
    except Exception as e:
        print(f"⚠ Warning: Could not load ML model: {e}")
        print("  Run 'python backend/train_model.py' to train the model first")
    
    print("✓ System ready!")
    print("="*60)
    
    yield
    
    # Shutdown
    print("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="SQL Injection Detection API",
    description="Real-time SQL injection detection using ML",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "SQL Injection Detection API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "detect": "/api/detect",
            "attacks": "/api/attacks",
            "stats": "/api/stats",
            "timeline": "/api/timeline",
            "patterns": "/api/patterns",
            "websocket": "/api/ws"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

