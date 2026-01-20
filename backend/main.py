from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager

# Load environment variables FIRST before any other imports
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, profile, clean, export, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("\n" + "="*60)
    print("SmartScrub API Starting...")
    print("="*60)
    
    from app.core.storage import storage
    if storage.use_gcs:
        print(f"✓ Storage: Google Cloud Storage")
        print(f"  Bucket: {storage.gcs_bucket_name}")
        print(f"  Project: {storage.gcs_project_id}")
    else:
        print("⚠ Storage: In-Memory (data will be lost on restart)")
        print("  Configure GCS for persistent storage")
    
    print("="*60 + "\n")
    
    yield
    
    # Shutdown (if needed)
    pass

app = FastAPI(
    title="SmartScrub API",
    description="Smart Data Cleaning Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(clean.router, prefix="/api", tags=["clean"])
app.include_router(export.router, prefix="/api", tags=["export"])

@app.get("/")
async def root():
    return {"message": "SmartScrub API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}