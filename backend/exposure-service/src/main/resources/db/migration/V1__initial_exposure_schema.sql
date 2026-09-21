CREATE TABLE IF NOT EXISTS exposure_thresholds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    normal_max_ppm DOUBLE NOT NULL,
    average_max_ppm DOUBLE NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exposure_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    worker_id VARCHAR(50) NOT NULL,
    predicted_ppm DOUBLE NOT NULL,
    exposure_duration INT NOT NULL,
    exposure_level VARCHAR(30) NOT NULL,
    exposure_datetime DATETIME NOT NULL,
    report_generated_status BOOLEAN NOT NULL DEFAULT FALSE,
    consultation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    consulted_by VARCHAR(50),
    consulted_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_exposure_worker_id (worker_id),
    INDEX idx_exposure_level (exposure_level),
    INDEX idx_exposure_consultation (consultation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial default threshold
INSERT IGNORE INTO exposure_thresholds (id, normal_max_ppm, average_max_ppm, updated_by, updated_at)
VALUES (1, 10.0, 20.0, 'SYSTEM', NOW());

-- Seed sample exposure history for worker W001
INSERT IGNORE INTO exposure_records (id, worker_id, predicted_ppm, exposure_duration, exposure_level, exposure_datetime, report_generated_status, consultation_status, created_at, updated_at)
VALUES 
(1, 'W001', 5.2, 15, 'NORMAL', NOW() - INTERVAL 2 DAY, true, 'PENDING', NOW(), NOW()),
(2, 'W001', 14.8, 30, 'AVERAGE', NOW() - INTERVAL 1 DAY, true, 'PENDING', NOW(), NOW()),
(3, 'W001', 26.5, 45, 'HIGH_RISK', NOW(), true, 'PENDING', NOW(), NOW());
