import mysql.connector
from mysql.connector import Error
import os
from typing import Optional

class DatabaseManager:
    """MySQL database manager for SmartScrub authentication"""
    
    def __init__(self):
        self.connection = None
        self.host = "localhost"
        self.database = "smartscrub"
        self.user = "root"
        self.password = "12345"
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password,
                autocommit=True
            )
            if self.connection.is_connected():
                print("Successfully connected to MySQL database")
                self.create_tables()
                return True
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("MySQL connection closed")
    
    def create_tables(self):
        """Create necessary tables if they don't exist"""
        try:
            cursor = self.connection.cursor()
            
            # Create users table
            create_users_table = """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP NULL
            )
            """
            
            cursor.execute(create_users_table)
            print("Users table created/verified successfully")
            
        except Error as e:
            print(f"Error creating tables: {e}")
        finally:
            if cursor:
                cursor.close()
    
    def execute_query(self, query: str, params: tuple = None):
        """Execute a query and return results"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            
            if query.strip().upper().startswith('SELECT'):
                result = cursor.fetchall()
            else:
                result = cursor.rowcount
            
            return result
        except Error as e:
            print(f"Error executing query: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
    
    def get_user_by_email(self, email: str):
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = %s"
        result = self.execute_query(query, (email,))
        return result[0] if result else None
    
    def create_user(self, email: str, password_hash: str, full_name: str = None):
        """Create a new user"""
        query = """
        INSERT INTO users (email, password_hash, full_name) 
        VALUES (%s, %s, %s)
        """
        result = self.execute_query(query, (email, password_hash, full_name))
        return result is not None
    
    def update_last_login(self, user_id: int):
        """Update user's last login timestamp"""
        query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s"
        return self.execute_query(query, (user_id,))

# Global database instance
db_manager = DatabaseManager()