-- SmartScrub Database Setup Script
-- Run this script to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS smartscrub;
USE smartscrub;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Insert sample admin user (password: admin123)
-- Password hash for 'admin123' using SHA-256 with salt
INSERT IGNORE INTO users (email, password_hash, full_name) VALUES 
('admin@smartscrub.com', 'sha256$a1b2c3d4e5f6789012345678901234567890$8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Admin User');

-- Show created tables
SHOW TABLES;

-- Show users table structure
DESCRIBE users;

-- Show sample data
SELECT id, email, full_name, created_at, is_active FROM users;