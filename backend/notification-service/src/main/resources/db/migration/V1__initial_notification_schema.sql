CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    reference_id VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notifications_recipient (recipient_user_id),
    INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial notification for W001
INSERT IGNORE INTO notifications (id, recipient_user_id, notification_type, title, message, reference_id, is_read, created_at, updated_at)
VALUES 
(1, 'W001', 'HIGH_EXPOSURE', 'HIGH H₂S EXPOSURE ALERT', 'High H₂S level of 26.5 PPM detected! Medical consultation required.', '3', false, NOW(), NOW());
