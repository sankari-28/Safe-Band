package com.h2sguard.exposureservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exposure_thresholds")
public class ExposureThreshold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "normal_max_ppm", nullable = false)
    private Double normalMaxPpm;

    @Column(name = "average_max_ppm", nullable = false)
    private Double averageMaxPpm;

    @Column(name = "updated_by", nullable = false, length = 50)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ExposureThreshold() {}

    public ExposureThreshold(Long id, Double normalMaxPpm, Double averageMaxPpm, String updatedBy, LocalDateTime updatedAt) {
        this.id = id;
        this.normalMaxPpm = normalMaxPpm;
        this.averageMaxPpm = averageMaxPpm;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Double getNormalMaxPpm() { return normalMaxPpm; }
    public void setNormalMaxPpm(Double normalMaxPpm) { this.normalMaxPpm = normalMaxPpm; }

    public Double getAverageMaxPpm() { return averageMaxPpm; }
    public void setAverageMaxPpm(Double averageMaxPpm) { this.averageMaxPpm = averageMaxPpm; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Double normalMaxPpm;
        private Double averageMaxPpm;
        private String updatedBy;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder normalMaxPpm(Double normalMaxPpm) { this.normalMaxPpm = normalMaxPpm; return this; }
        public Builder averageMaxPpm(Double averageMaxPpm) { this.averageMaxPpm = averageMaxPpm; return this; }
        public Builder updatedBy(String updatedBy) { this.updatedBy = updatedBy; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public ExposureThreshold build() {
            return new ExposureThreshold(id, normalMaxPpm, averageMaxPpm, updatedBy, updatedAt);
        }
    }
}
