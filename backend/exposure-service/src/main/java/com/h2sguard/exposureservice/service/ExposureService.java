package com.h2sguard.exposureservice.service;

import com.h2sguard.exposureservice.dto.*;
import com.h2sguard.exposureservice.entity.ExposureLevel;

import java.util.List;

public interface ExposureService {

    ExposureThresholdDto getThreshold();

    ExposureThresholdDto updateThreshold(UpdateThresholdRequest request, String updatedBy);

    ExposureRecordDto recordExposure(CreateExposureRequest request);

    ExposureLevel classifyPpm(Double ppm, Double normalMaxPpm, Double averageMaxPpm);

    List<ExposureRecordDto> getWorkerExposures(String workerId);

    ExposureRecordDto getExposureDetails(Long exposureId);

    List<ExposureRecordDto> getAllExposures();

    List<ExposureRecordDto> getHighRiskExposures();

    ExposureRecordDto consultExposure(Long exposureId, String consultedBy);
}
