package com.h2sguard.exposureservice.service;

import com.h2sguard.exposureservice.dto.*;
import com.h2sguard.exposureservice.entity.*;
import com.h2sguard.exposureservice.exception.BadRequestException;
import com.h2sguard.exposureservice.repository.ExposureRecordRepository;
import com.h2sguard.exposureservice.repository.ExposureThresholdRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExposureServiceTest {

    @Mock
    private ExposureThresholdRepository thresholdRepository;

    @Mock
    private ExposureRecordRepository recordRepository;

    @Mock
    private NotificationClient notificationClient;

    @InjectMocks
    private ExposureServiceImpl exposureService;

    private ExposureThreshold defaultThreshold;

    @BeforeEach
    void setUp() {
        defaultThreshold = ExposureThreshold.builder()
                .id(1L)
                .normalMaxPpm(10.0)
                .averageMaxPpm(20.0)
                .updatedBy("SYSTEM")
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void classifyPpm_ThresholdEvaluationRules() {
        Double normalMax = 10.0;
        Double averageMax = 20.0;

        // 5 PPM -> NORMAL
        assertEquals(ExposureLevel.NORMAL, exposureService.classifyPpm(5.0, normalMax, averageMax));

        // 10 PPM -> NORMAL
        assertEquals(ExposureLevel.NORMAL, exposureService.classifyPpm(10.0, normalMax, averageMax));

        // 15 PPM -> AVERAGE
        assertEquals(ExposureLevel.AVERAGE, exposureService.classifyPpm(15.0, normalMax, averageMax));

        // 20 PPM -> AVERAGE
        assertEquals(ExposureLevel.AVERAGE, exposureService.classifyPpm(20.0, normalMax, averageMax));

        // 25 PPM -> HIGH_RISK
        assertEquals(ExposureLevel.HIGH_RISK, exposureService.classifyPpm(25.0, normalMax, averageMax));
    }

    @Test
    void updateThreshold_InvalidRange_ThrowsException() {
        UpdateThresholdRequest req = new UpdateThresholdRequest(25.0, 20.0); // normalMax >= averageMax

        assertThrows(BadRequestException.class, () -> exposureService.updateThreshold(req, "S001"));
    }

    @Test
    void updateThreshold_NegativeValue_ThrowsException() {
        UpdateThresholdRequest req = new UpdateThresholdRequest(-5.0, 20.0);

        assertThrows(BadRequestException.class, () -> exposureService.updateThreshold(req, "S001"));
    }

    @Test
    void consultExposure_Success() {
        ExposureRecord record = ExposureRecord.builder()
                .id(100L)
                .workerId("W001")
                .predictedPpm(28.0)
                .exposureDuration(30)
                .exposureLevel(ExposureLevel.HIGH_RISK)
                .consultationStatus(ConsultationStatus.PENDING)
                .build();

        when(recordRepository.findById(100L)).thenReturn(Optional.of(record));
        when(recordRepository.save(any(ExposureRecord.class))).thenAnswer(i -> i.getArgument(0));

        ExposureRecordDto result = exposureService.consultExposure(100L, "S001");

        assertNotNull(result);
        assertEquals(ConsultationStatus.CONSULTED, result.getConsultationStatus());
        assertEquals("S001", result.getConsultedBy());
        assertNotNull(result.getConsultedAt());
    }
}
