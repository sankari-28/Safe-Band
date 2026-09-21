CREATE TABLE IF NOT EXISTS analysis_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    analysis_id VARCHAR(50) NOT NULL UNIQUE,
    worker_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    mock_predicted_ppm DOUBLE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analysis_worker_id (worker_id),
    INDEX idx_analysis_uuid (analysis_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
