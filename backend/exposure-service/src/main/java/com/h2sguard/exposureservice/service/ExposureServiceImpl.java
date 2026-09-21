package com.h2sguard.exposureservice.service;

import com.h2sguard.exposureservice.dto.*;
import com.h2sguard.exposureservice.entity.*;
import com.h2sguard.exposureservice.exception.BadRequestException;
import com.h2sguard.exposureservice.exception.ResourceNotFoundException;
import com.h2sguard.exposureservice.repository.ExposureRecordRepository;
import com.h2sguard.exposureservice.repository.ExposureThresholdRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExposureServiceImpl implements ExposureService {

    private final ExposureThresholdRepository thresholdRepository;
    private final ExposureRecordRepository recordRepository;
    private final NotificationClient notificationClient;

    public ExposureServiceImpl(ExposureThresholdRepository thresholdRepository,
                               ExposureRecordRepository recordRepository,
                               NotificationClient notificationClient) {
        this.thresholdRepository = thresholdRepository;
        this.recordRepository = recordRepository;
        this.notificationClient = notificationClient;
    }

    @Override
    @Transactional(readOnly = true)
    public ExposureThresholdDto getThreshold() {
        ExposureThreshold threshold = getOrCreateCurrentThreshold();
        return ExposureThresholdDto.fromEntity(threshold);
    }

    @Override
    @Transactional
    public ExposureThresholdDto updateThreshold(UpdateThresholdRequest request, String updatedBy) {
        if (request.getNormalMaxPpm() <= 0 || request.getAverageMaxPpm() <= 0) {
            throw new BadRequestException("Threshold values must be greater than zero");
        }
        if (request.getNormalMaxPpm() >= request.getAverageMaxPpm()) {
            throw new BadRequestException("normalMaxPpm (" + request.getNormalMaxPpm() + 
                    ") must be strictly less than averageMaxPpm (" + request.getAverageMaxPpm() + ")");
        }

        ExposureThreshold threshold = ExposureThreshold.builder()
                .normalMaxPpm(request.getNormalMaxPpm())
                .averageMaxPpm(request.getAverageMaxPpm())
                .updatedBy(updatedBy)
                .build();

        ExposureThreshold saved = thresholdRepository.save(threshold);
        return ExposureThresholdDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public ExposureRecordDto recordExposure(CreateExposureRequest request) {
        ExposureThreshold currentThreshold = getOrCreateCurrentThreshold();

        ExposureLevel level = classifyPpm(
                request.getPredictedPpm(),
                currentThreshold.getNormalMaxPpm(),
                currentThreshold.getAverageMaxPpm()
        );

        ExposureRecord record = ExposureRecord.builder()
                .workerId(request.getWorkerId())
                .predictedPpm(request.getPredictedPpm())
                .exposureDuration(request.getExposureDuration())
                .exposureLevel(level)
                .exposureDateTime(LocalDateTime.now())
                .reportGeneratedStatus(true)
                .consultationStatus(ConsultationStatus.PENDING)
                .build();

        ExposureRecord saved = recordRepository.save(record);

        if (level == ExposureLevel.HIGH_RISK) {
            notificationClient.sendHighExposureNotification(saved.getWorkerId(), saved.getPredictedPpm(), saved.getId());
        }

        return ExposureRecordDto.fromEntity(saved);
    }

    @Override
    public ExposureLevel classifyPpm(Double ppm, Double normalMaxPpm, Double averageMaxPpm) {
        if (ppm == null || ppm < 0) {
            throw new BadRequestException("PPM value cannot be null or negative");
        }
        if (ppm <= normalMaxPpm) {
            return ExposureLevel.NORMAL;
        } else if (ppm <= averageMaxPpm) {
            return ExposureLevel.AVERAGE;
        } else {
            return ExposureLevel.HIGH_RISK;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExposureRecordDto> getWorkerExposures(String workerId) {
        return recordRepository.findByWorkerIdOrderByExposureDateTimeDesc(workerId).stream()
                .map(ExposureRecordDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExposureRecordDto getExposureDetails(Long exposureId) {
        ExposureRecord record = recordRepository.findById(exposureId)
                .orElseThrow(() -> new ResourceNotFoundException("Exposure record not found with ID: " + exposureId));
        return ExposureRecordDto.fromEntity(record);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExposureRecordDto> getAllExposures() {
        return recordRepository.findAll().stream()
                .map(ExposureRecordDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExposureRecordDto> getHighRiskExposures() {
        return recordRepository.findByExposureLevelOrderByExposureDateTimeDesc(ExposureLevel.HIGH_RISK).stream()
                .map(ExposureRecordDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExposureRecordDto consultExposure(Long exposureId, String consultedBy) {
        ExposureRecord record = recordRepository.findById(exposureId)
                .orElseThrow(() -> new ResourceNotFoundException("Exposure record not found with ID: " + exposureId));

        record.setConsultationStatus(ConsultationStatus.CONSULTED);
        record.setConsultedBy(consultedBy);
        record.setConsultedAt(LocalDateTime.now());

        ExposureRecord updated = recordRepository.save(record);
        return ExposureRecordDto.fromEntity(updated);
    }

    private ExposureThreshold getOrCreateCurrentThreshold() {
        return thresholdRepository.findFirstByOrderByIdDesc()
                .orElseGet(() -> thresholdRepository.save(
                        ExposureThreshold.builder()
                                .normalMaxPpm(10.0)
                                .averageMaxPpm(20.0)
                                .updatedBy("SYSTEM")
                                .build()
                ));
    }
}
