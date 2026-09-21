package com.h2sguard.aianalysisservice.dto;

import java.time.LocalDateTime;

public class AnalysisResponse {

    private String analysisId;
    private String workerId;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private Double predictedPpm;
    private String status;
    private String message;
    private boolean isMock;
    private LocalDateTime timestamp;

    public AnalysisResponse() {}

    public AnalysisResponse(String analysisId, String workerId, String fileName, Long fileSize,
                            String contentType, Double predictedPpm, String status,
                            String message, boolean isMock, LocalDateTime timestamp) {
        this.analysisId = analysisId;
        this.workerId = workerId;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.predictedPpm = predictedPpm;
        this.status = status;
        this.message = message;
        this.isMock = isMock;
        this.timestamp = timestamp;
    }

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

    public Double getPredictedPpm() { return predictedPpm; }
    public void setPredictedPpm(Double predictedPpm) { this.predictedPpm = predictedPpm; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isMock() { return isMock; }
    public void setMock(boolean isMock) { this.isMock = isMock; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String analysisId;
        private String workerId;
        private String fileName;
        private Long fileSize;
        private String contentType;
        private Double predictedPpm;
        private String status;
        private String message;
        private boolean isMock = true;
        private LocalDateTime timestamp;

        public Builder analysisId(String analysisId) { this.analysisId = analysisId; return this; }
        public Builder workerId(String workerId) { this.workerId = workerId; return this; }
        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public Builder contentType(String contentType) { this.contentType = contentType; return this; }
        public Builder predictedPpm(Double predictedPpm) { this.predictedPpm = predictedPpm; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder isMock(boolean isMock) { this.isMock = isMock; return this; }
        public Builder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public AnalysisResponse build() {
            return new AnalysisResponse(analysisId, workerId, fileName, fileSize, contentType, predictedPpm, status, message, isMock, timestamp);
        }
    }
}
