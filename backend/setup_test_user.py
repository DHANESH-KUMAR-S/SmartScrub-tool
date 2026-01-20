#!/usr/bin/env python3
"""
Script to set up test user for SmartScrub authentication
"""

from app.core.database import db_manager
from app.core.auth import get_password_hash

def setup_test_user():
    """Create a test user for development"""
    
    # Test user credentials
    test_email = "test@example.com"
    test_password = "password123"
    test_name = "Test User"
    
    print("Setting up test user...")
    
    # Connect to database
    if not db_manager.connect():
        print("Failed to connect to database")
        return False
    
    try:
        # Check if user already exists
        existing_user = db_manager.get_user_by_email(test_email)
        if existing_user:
            print(f"User {test_email} already exists")
            return True
        
        # Hash password
        hashed_password = get_password_hash(test_password)
        print(f"Password hash: {hashed_password}")
        
        # Create user
        success = db_manager.create_user(test_email, hashed_password, test_name)
        
        if success:
            print(f"Test user created successfully!")
            print(f"Email: {test_email}")
            print(f"Password: {test_password}")
            return True
        else:
            print("Failed to create test user")
            return False
            
    except Exception as e:
        print(f"Error setting up test user: {e}")
        return False
    finally:
        db_manager.disconnect()

if __name__ == "__main__":
    setup_test_user()