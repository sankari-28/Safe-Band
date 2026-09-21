package com.h2sguard.aianalysisservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_records")
public class AnalysisRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "analysis_id", nullable = false, unique = true, length = 50)
    private String analysisId;

    @Column(name = "worker_id", nullable = false, length = 50)
    private String workerId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "mock_predicted_ppm", nullable = false)
    private Double mockPredictedPpm;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AnalysisRecord() {}

    public AnalysisRecord(Long id, String analysisId, String workerId, String fileName,
                          Long fileSize, String contentType, Double mockPredictedPpm,
                          String status, LocalDateTime createdAt) {
        this.id = id;
        this.analysisId = analysisId;
        this.workerId = workerId;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.mockPredictedPpm = mockPredictedPpm;
        this.status = status;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAnalysisId() { return analysisId; }
    public void setAnalysisId(String analysisId) { this.analysisId = analysisId; }

    public String getWorkerId() { return workerId; }
    public void setWorkerId(String workerId) { this.workerId = workerId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Double getMockPredictedPpm() { return mockPredictedPpm; }
    public void setMockPredictedPpm(Double mockPredictedPpm) { this.mockPredictedPpm = mockPredictedPpm; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String analysisId;
        private String workerId;
        private String fileName;
        private Long fileSize;
        private String contentType;
        private Double mockPredictedPpm;
        private String status;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder analysisId(String analysisId) { this.analysisId = analysisId; return this; }
        public Builder workerId(String workerId) { this.workerId = workerId; return this; }
        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public Builder contentType(String contentType) { this.contentType = contentType; return this; }
        public Builder mockPredictedPpm(Double mockPredictedPpm) { this.mockPredictedPpm = mockPredictedPpm; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AnalysisRecord build() {
            return new AnalysisRecord(id, analysisId, workerId, fileName, fileSize, contentType, mockPredictedPpm, status, createdAt);
        }
    }
}
