#!/usr/bin/env python3
"""
Quick script to generate password hash for admin user
Run this to get the correct hash for 'admin123'
"""

import hashlib
import secrets

def get_password_hash(password: str) -> str:
    """Hash a password using SHA-256 with salt"""
    # Generate a random salt
    salt = secrets.token_hex(16)
    
    # Hash password with salt
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    
    # Return in format: algorithm$salt$hash
    return f"sha256${salt}${password_hash}"

if __name__ == "__main__":
    password = "admin123"
    hashed = get_password_hash(password)
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    print("\nSQL command to update database:")
    print(f"UPDATE users SET password_hash = '{hashed}' WHERE email = 'admin@smartscrub.com';")