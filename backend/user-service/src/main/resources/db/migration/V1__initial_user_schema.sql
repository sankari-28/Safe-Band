CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    department VARCHAR(100),
    role VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_user_id (user_id),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial default users (Password for all default users: password123)
-- BCrypt hash for "password123": $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0n98O862lN.w.21V3g6
INSERT IGNORE INTO users (user_id, full_name, email, phone_number, department, role, password_hash, active, created_at, updated_at)
VALUES 
('A001', 'System Administrator', 'admin@h2sguard.com', '+1-555-0100', 'Administration', 'ADMIN', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0n98O862lN.w.21V3g6', true, NOW(), NOW()),
('S001', 'Sarah Connor', 'safety@h2sguard.com', '+1-555-0101', 'Safety Operations', 'SAFETY_OFFICER', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0n98O862lN.w.21V3g6', true, NOW(), NOW()),
('W001', 'John Doe', 'worker1@h2sguard.com', '+1-555-0102', 'Field Plant A', 'WORKER', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0n98O862lN.w.21V3g6', true, NOW(), NOW());
