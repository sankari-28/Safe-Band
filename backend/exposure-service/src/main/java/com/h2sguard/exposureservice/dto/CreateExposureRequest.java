package com.h2sguard.exposureservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public class CreateExposureRequest {

    @NotBlank(message = "Worker ID is required")
    private String workerId;

    @NotNull(message = "Predicted PPM is required")
    @PositiveOrZero(message = "Predicted PPM cannot be negative")
    private Double predictedPpm;

    @NotNull(message = "Exposure duration is required")
    @Positive(message = "Exposure duration must be greater than 0")
    private Integer exposureDuration;

    public CreateExposureRequest() {}

    public CreateExposureRequest(String workerId, Double predictedPpm, Integer exposureDuration) {
        this.workerId = workerId;
        this.predictedPpm = predictedPpm;
        this.exposureDuration = exposureDuration;
    }

    public String getWorkerId() { return workerId; }
    public void setWorkerId(String workerId) { this.workerId = workerId; }

    public Double getPredictedPpm() { return predictedPpm; }
    public void setPredictedPpm(Double predictedPpm) { this.predictedPpm = predictedPpm; }

    public Integer getExposureDuration() { return exposureDuration; }
    public void setExposureDuration(Integer exposureDuration) { this.exposureDuration = exposureDuration; }
}
