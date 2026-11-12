"""
Cipher Labs - FastAPI Application Factory
SECURE. RECOVER. VERIFY.
Digital Forensics and Data Sanitization Sidecar Engine.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import CONFIG_MODE, get_redacted_mongo_uri, MONGODB_DB_NAME
from .db import init_db, close_db
from .schemas import ResponseEnvelope
from .routers import auth, operations

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas and ensure unique compound indexes
    await init_db()
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title="Cipher Labs Backend Sidecar",
    description="Local forensic engine with MongoDB Atlas persistence and SHA-256 chained auditing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS: Allow Tauri Webview and Local Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:1420",
    "http://localhost:3000",
    "http://tauri.localhost",
    "tauri://localhost",
    "http://127.0.0.1:1420",
    "http://127.0.0.1:3000"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler returning standardized envelope
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal forensic engine error occurred.",
                "retryable": False,
                "details": {}
            },
            "meta": {"path": request.url.path}
        }
    )

# Routers
app.include_router(auth.router)
app.include_router(operations.router)

# Health Endpoint (PART 6.1)
@app.get("/api/health", response_model=ResponseEnvelope)
async def health_check():
    return ResponseEnvelope(
        data={
            "service": "Cipher Labs Forensic Engine",
            "status": "HEALTHY",
            "version": "1.0.0",
            "config_mode": CONFIG_MODE,
            "database": "MongoDB Atlas" if CONFIG_MODE == "OK" else "Offline Fallback"
        }
    )

# Public Config Endpoint (PART 6.1)
@app.get("/api/config", response_model=ResponseEnvelope)
async def public_config():
    return ResponseEnvelope(
        data={
            "database_provider": "MongoDB Atlas",
            "mongodb_cluster": get_redacted_mongo_uri(),
            "database_name": MONGODB_DB_NAME,
            "auth_type": "FastAPI Server-Side JWT",
            "features": {
                "secure_erasure_simulation": True,
                "recovery_vault_restore": True,
                "forensic_disk_carver": True,
                "tamper_proof_audit_chain": True
            }
        }
    )
