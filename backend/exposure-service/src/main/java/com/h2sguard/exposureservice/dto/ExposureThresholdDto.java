package com.h2sguard.exposureservice.dto;

import com.h2sguard.exposureservice.entity.ExposureThreshold;
import java.time.LocalDateTime;

public class ExposureThresholdDto {

    private Long id;
    private Double normalMaxPpm;
    private Double averageMaxPpm;
    private String updatedBy;
    private LocalDateTime updatedAt;

    public ExposureThresholdDto() {}

    public ExposureThresholdDto(Long id, Double normalMaxPpm, Double averageMaxPpm, String updatedBy, LocalDateTime updatedAt) {
        this.id = id;
        this.normalMaxPpm = normalMaxPpm;
        this.averageMaxPpm = averageMaxPpm;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }

    public static ExposureThresholdDto fromEntity(ExposureThreshold entity) {
        if (entity == null) return null;
        return new ExposureThresholdDto(entity.getId(), entity.getNormalMaxPpm(), entity.getAverageMaxPpm(), entity.getUpdatedBy(), entity.getUpdatedAt());
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
}
