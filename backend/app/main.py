"""
FastAPI Main Application
SQL Injection Detection System
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware

from .api.routes import router, database
from .api.federated_routes import router as federated_router
from .services.ml_detector import MLDetector
from .services.knowledge_base import KnowledgeBase
from .services.honeypot.service import HoneypotService
from .services.proxy.service import ProxyService
from .services.federated.coordinator import FederatedCoordinator
from .database.federated_schema import FederatedDatabase

# Global services (initialized in lifespan)
knowledge_base = None
honeypot_service = None
proxy_service = None
federated_db = None
federated_coordinator = None

class ProxyMiddleware(BaseHTTPMiddleware):
    """Middleware to intercept requests and route suspicious ones to honeypot"""
    async def dispatch(self, request: Request, call_next):
        # Skip proxy check for API routes and static files
        if request.url.path.startswith("/api/") or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
            return await call_next(request)
        
        # Check if request is suspicious
        if proxy_service:
            response = await proxy_service.intercept_request(request, path=request.url.path)
            if response:
                return response
        
        # Continue normal processing
        return await call_next(request)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global knowledge_base, honeypot_service, proxy_service, federated_db, federated_coordinator
    
    # Startup
    print("Starting SQL Injection Detection System...")
    
    # Initialize database
    await database.initialize()
    print("✓ Database initialized")
    
    # Initialize federated database
    federated_db = FederatedDatabase(db_path="data/knowledge_base.db")
    await federated_db.initialize_federated_tables()
    print("✓ Federated database initialized")
    
    # Initialize knowledge base
    knowledge_base = KnowledgeBase(database)
    print("✓ Knowledge base initialized")
    
    # Initialize honeypot service
    honeypot_service = HoneypotService(knowledge_base)
    print("✓ Honeypot service initialized")
    
    # Initialize proxy service
    proxy_service = ProxyService(honeypot_service)
    print("✓ Proxy service initialized")
    
    # Initialize federated learning coordinator (only in coordinator mode)
    import os
    app_mode = os.getenv("APP_MODE", "coordinator")
    if app_mode == "coordinator":
        federated_coordinator = FederatedCoordinator(db_connection=federated_db)
        federated_coordinator.initialize_federation()
        # Set coordinator reference for routes
        from .api.federated_routes import set_coordinator
        set_coordinator(federated_coordinator)
        print("✓ Federated learning coordinator initialized")
    
    # Load ML model
    try:
        ml_detector = MLDetector(model_path='app/models/rf_detector.pkl')
        print("✓ ML model loaded")
    except Exception as e:
        print(f"⚠ Warning: Could not load ML model: {e}")
        print("  Run 'python train_model.py' to train the model first")
    
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

# Proxy middleware (must be after CORS)
app.add_middleware(ProxyMiddleware)

# Include API routes
app.include_router(router, prefix="/api")

# Include federated learning routes
app.include_router(federated_router, prefix="/api")

# Honeypot catch-all route (for direct honeypot access)
@app.api_route("/honeypot/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def honeypot_endpoint(path: str, request: Request):
    """Direct honeypot endpoint"""
    if honeypot_service:
        return await honeypot_service.handle_attack(request, path=path)
    return Response(content='{"error": "Honeypot service not available"}', media_type="application/json")

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
            "websocket": "/api/ws",
            "honeypot": "/honeypot/{path}",
            "federated": {
                "register": "/api/federated/register",
                "upload-update": "/api/federated/upload-update",
                "download-model": "/api/federated/download-model",
                "status": "/api/federated/status",
                "start-round": "/api/federated/start-round",
                "history": "/api/federated/history"
            }
        },
        "services": {
            "proxy": "active",
            "honeypot": "active",
            "detection_engine": "active",
            "federated_learning": "active" if federated_coordinator else "inactive"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

