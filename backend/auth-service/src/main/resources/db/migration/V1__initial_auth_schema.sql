CREATE TABLE IF NOT EXISTS auth_credentials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_auth_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial credentials (password: password123)
INSERT IGNORE INTO auth_credentials (user_id, password_hash, role, active, created_at, updated_at)
VALUES 
('A001', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0n98O862lN.w.21V3g6', 'ADMIN', true, NOW(), NOW()),
('S001', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0n98O862lN.w.21V3g6', 'SAFETY_OFFICER', true, NOW(), NOW()),
('W001', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0n98O862lN.w.21V3g6', 'WORKER', true, NOW(), NOW());
