package com.h2sguard.exposureservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class UpdateThresholdRequest {

    @NotNull(message = "normalMaxPpm is required")
    @Positive(message = "normalMaxPpm must be positive")
    private Double normalMaxPpm;

    @NotNull(message = "averageMaxPpm is required")
    @Positive(message = "averageMaxPpm must be positive")
    private Double averageMaxPpm;

    public UpdateThresholdRequest() {}

    public UpdateThresholdRequest(Double normalMaxPpm, Double averageMaxPpm) {
        this.normalMaxPpm = normalMaxPpm;
        this.averageMaxPpm = averageMaxPpm;
    }

    public Double getNormalMaxPpm() { return normalMaxPpm; }
    public void setNormalMaxPpm(Double normalMaxPpm) { this.normalMaxPpm = normalMaxPpm; }

    public Double getAverageMaxPpm() { return averageMaxPpm; }
    public void setAverageMaxPpm(Double averageMaxPpm) { this.averageMaxPpm = averageMaxPpm; }
}
