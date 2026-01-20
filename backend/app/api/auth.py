from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta, datetime
from app.core.auth import (
    User, UserCreate, UserLogin, Token, 
    verify_password, get_password_hash, create_access_token, verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.core.database import db_manager

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=dict)
async def register(user: UserCreate):
    """Register a new user"""
    
    # Connect to database
    if not db_manager.connect():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed"
        )
    
    try:
        # Check if user already exists
        existing_user = db_manager.get_user_by_email(user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password and create user
        hashed_password = get_password_hash(user.password)
        success = db_manager.create_user(user.email, hashed_password, user.full_name)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        return {
            "success": True,
            "message": "User registered successfully",
            "email": user.email
        }
    
    finally:
        db_manager.disconnect()

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """Authenticate user and return access token"""
    
    print(f"Login attempt for email: {user.email}")
    
    # Connect to database
    if not db_manager.connect():
        print("Database connection failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed"
        )
    
    try:
        # Get user from database
        db_user = db_manager.get_user_by_email(user.email)
        print(f"User found in database: {db_user is not None}")
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        password_valid = verify_password(user.password, db_user["password_hash"])
        print(f"Password verification: {password_valid}")
        
        if not password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Update last login
        db_manager.update_last_login(db_user["id"])
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        print("Login successful, returning token")
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    finally:
        db_manager.disconnect()

@router.get("/me", response_model=User)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    
    # Verify token
    email = verify_token(credentials.credentials)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Connect to database
    if not db_manager.connect():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed"
        )
    
    try:
        # Get user from database
        db_user = db_manager.get_user_by_email(email)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return User(
            id=db_user["id"],
            email=db_user["email"],
            full_name=db_user["full_name"],
            is_active=db_user["is_active"]
        )
    
    finally:
        db_manager.disconnect()

@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}

@router.get("/test")
async def test_auth():
    """Test endpoint to check if auth API is working"""
    return {"message": "Auth API is working", "timestamp": datetime.now().isoformat()}

@router.get("/check")
async def check_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Check if user is authenticated"""
    email = verify_token(credentials.credentials)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    return {"authenticated": True, "email": email}