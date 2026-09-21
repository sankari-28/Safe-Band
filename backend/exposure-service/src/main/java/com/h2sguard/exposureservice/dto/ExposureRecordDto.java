package com.h2sguard.exposureservice.dto;

import com.h2sguard.exposureservice.entity.ConsultationStatus;
import com.h2sguard.exposureservice.entity.ExposureLevel;
import com.h2sguard.exposureservice.entity.ExposureRecord;

import java.time.LocalDateTime;

public class ExposureRecordDto {

    private Long id;
    private String workerId;
    private Double predictedPpm;
    private Integer exposureDuration;
    private ExposureLevel exposureLevel;
    private LocalDateTime exposureDateTime;
    private boolean reportGeneratedStatus;
    private ConsultationStatus consultationStatus;
    private String consultedBy;
    private LocalDateTime consultedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ExposureRecordDto() {}

    public ExposureRecordDto(Long id, String workerId, Double predictedPpm, Integer exposureDuration,
                             ExposureLevel exposureLevel, LocalDateTime exposureDateTime,
                             boolean reportGeneratedStatus, ConsultationStatus consultationStatus,
                             String consultedBy, LocalDateTime consultedAt,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.workerId = workerId;
        this.predictedPpm = predictedPpm;
        this.exposureDuration = exposureDuration;
        this.exposureLevel = exposureLevel;
        this.exposureDateTime = exposureDateTime;
        this.reportGeneratedStatus = reportGeneratedStatus;
        this.consultationStatus = consultationStatus;
        this.consultedBy = consultedBy;
        this.consultedAt = consultedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ExposureRecordDto fromEntity(ExposureRecord record) {
        if (record == null) return null;
        return ExposureRecordDto.builder()
                .id(record.getId())
                .workerId(record.getWorkerId())
                .predictedPpm(record.getPredictedPpm())
                .exposureDuration(record.getExposureDuration())
                .exposureLevel(record.getExposureLevel())
                .exposureDateTime(record.getExposureDateTime())
                .reportGeneratedStatus(record.isReportGeneratedStatus())
                .consultationStatus(record.getConsultationStatus())
                .consultedBy(record.getConsultedBy())
                .consultedAt(record.getConsultedAt())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getWorkerId() { return workerId; }
    public void setWorkerId(String workerId) { this.workerId = workerId; }

    public Double getPredictedPpm() { return predictedPpm; }
    public void setPredictedPpm(Double predictedPpm) { this.predictedPpm = predictedPpm; }

    public Integer getExposureDuration() { return exposureDuration; }
    public void setExposureDuration(Integer exposureDuration) { this.exposureDuration = exposureDuration; }

    public ExposureLevel getExposureLevel() { return exposureLevel; }
    public void setExposureLevel(ExposureLevel exposureLevel) { this.exposureLevel = exposureLevel; }

    public LocalDateTime getExposureDateTime() { return exposureDateTime; }
    public void setExposureDateTime(LocalDateTime exposureDateTime) { this.exposureDateTime = exposureDateTime; }

    public boolean isReportGeneratedStatus() { return reportGeneratedStatus; }
    public void setReportGeneratedStatus(boolean reportGeneratedStatus) { this.reportGeneratedStatus = reportGeneratedStatus; }

    public ConsultationStatus getConsultationStatus() { return consultationStatus; }
    public void setConsultationStatus(ConsultationStatus consultationStatus) { this.consultationStatus = consultationStatus; }

    public String getConsultedBy() { return consultedBy; }
    public void setConsultedBy(String consultedBy) { this.consultedBy = consultedBy; }

    public LocalDateTime getConsultedAt() { return consultedAt; }
    public void setConsultedAt(LocalDateTime consultedAt) { this.consultedAt = consultedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String workerId;
        private Double predictedPpm;
        private Integer exposureDuration;
        private ExposureLevel exposureLevel;
        private LocalDateTime exposureDateTime;
        private boolean reportGeneratedStatus;
        private ConsultationStatus consultationStatus;
        private String consultedBy;
        private LocalDateTime consultedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder workerId(String workerId) { this.workerId = workerId; return this; }
        public Builder predictedPpm(Double predictedPpm) { this.predictedPpm = predictedPpm; return this; }
        public Builder exposureDuration(Integer exposureDuration) { this.exposureDuration = exposureDuration; return this; }
        public Builder exposureLevel(ExposureLevel exposureLevel) { this.exposureLevel = exposureLevel; return this; }
        public Builder exposureDateTime(LocalDateTime exposureDateTime) { this.exposureDateTime = exposureDateTime; return this; }
        public Builder reportGeneratedStatus(boolean reportGeneratedStatus) { this.reportGeneratedStatus = reportGeneratedStatus; return this; }
        public Builder consultationStatus(ConsultationStatus consultationStatus) { this.consultationStatus = consultationStatus; return this; }
        public Builder consultedBy(String consultedBy) { this.consultedBy = consultedBy; return this; }
        public Builder consultedAt(LocalDateTime consultedAt) { this.consultedAt = consultedAt; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public ExposureRecordDto build() {
            return new ExposureRecordDto(id, workerId, predictedPpm, exposureDuration, exposureLevel, exposureDateTime, reportGeneratedStatus, consultationStatus, consultedBy, consultedAt, createdAt, updatedAt);
        }
    }
}
