package com.h2sguard.exposureservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exposure_records")
public class ExposureRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false, length = 50)
    private String workerId;

    @Column(name = "predicted_ppm", nullable = false)
    private Double predictedPpm;

    @Column(name = "exposure_duration", nullable = false)
    private Integer exposureDuration; // in minutes

    @Enumerated(EnumType.STRING)
    @Column(name = "exposure_level", nullable = false, length = 30)
    private ExposureLevel exposureLevel;

    @Column(name = "exposure_datetime", nullable = false)
    private LocalDateTime exposureDateTime;

    @Column(name = "report_generated_status", nullable = false)
    private boolean reportGeneratedStatus = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_status", nullable = false, length = 30)
    private ConsultationStatus consultationStatus = ConsultationStatus.PENDING;

    @Column(name = "consulted_by", length = 50)
    private String consultedBy;

    @Column(name = "consulted_at")
    private LocalDateTime consultedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ExposureRecord() {}

    public ExposureRecord(Long id, String workerId, Double predictedPpm, Integer exposureDuration,
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
        this.consultationStatus = consultationStatus != null ? consultationStatus : ConsultationStatus.PENDING;
        this.consultedBy = consultedBy;
        this.consultedAt = consultedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (exposureDateTime == null) {
            exposureDateTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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
        private boolean reportGeneratedStatus = false;
        private ConsultationStatus consultationStatus = ConsultationStatus.PENDING;
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

        public ExposureRecord build() {
            return new ExposureRecord(id, workerId, predictedPpm, exposureDuration, exposureLevel, exposureDateTime, reportGeneratedStatus, consultationStatus, consultedBy, consultedAt, createdAt, updatedAt);
        }
    }
}
