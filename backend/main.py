from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, profile, clean, export, auth

app = FastAPI(
    title="SmartScrub API",
    description="Smart Data Cleaning Platform API",
    version="1.0.0"
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