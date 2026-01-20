from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import secrets
from fastapi import HTTPException, status
from pydantic import BaseModel

# Security configuration
SECRET_KEY = "smartscrub-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class User(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool = True

class UserInDB(User):
    password_hash: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using simple SHA-256 + salt"""
    try:
        # Extract salt and hash from stored password
        parts = hashed_password.split('$')
        if len(parts) != 3 or parts[0] != 'sha256':
            return False
        
        salt = parts[1]
        stored_hash = parts[2]
        
        # Hash the plain password with the same salt
        password_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        
        return password_hash == stored_hash
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using SHA-256 with salt"""
    try:
        # Generate a random salt
        salt = secrets.token_hex(16)
        
        # Hash password with salt
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        
        # Return in format: algorithm$salt$hash
        return f"sha256${salt}${password_hash}"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password hashing failed: {str(e)}"
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None