package com.h2sguard.aianalysisservice.service;

import com.h2sguard.aianalysisservice.dto.AnalysisResponse;
import com.h2sguard.aianalysisservice.entity.AnalysisRecord;
import com.h2sguard.aianalysisservice.exception.BadRequestException;
import com.h2sguard.aianalysisservice.repository.AnalysisRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAnalysisServiceTest {

    @Mock
    private AnalysisRecordRepository recordRepository;

    @InjectMocks
    private AiAnalysisServiceImpl aiAnalysisService;

    @Test
    void processImageAnalysis_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "sensor.png", "image/png", "fake-image-bytes".getBytes()
        );

        when(recordRepository.save(any(AnalysisRecord.class))).thenAnswer(i -> i.getArgument(0));

        AnalysisResponse response = aiAnalysisService.processImageAnalysis(file, "W001");

        assertNotNull(response);
        assertNotNull(response.getAnalysisId());
        assertTrue(response.getAnalysisId().startsWith("ANL-"));
        assertEquals("W001", response.getWorkerId());
        assertEquals("sensor.png", response.getFileName());
        assertEquals("image/png", response.getContentType());
        assertTrue(response.getPredictedPpm() >= 0);
    }

    @Test
    void processImageAnalysis_InvalidContentType_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "document.pdf", "application/pdf", "fake-pdf-bytes".getBytes()
        );

        assertThrows(BadRequestException.class, () -> aiAnalysisService.processImageAnalysis(file, "W001"));
    }

    @Test
    void processImageAnalysis_EmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.png", "image/png", new byte[0]
        );

        assertThrows(BadRequestException.class, () -> aiAnalysisService.processImageAnalysis(emptyFile, "W001"));
    }
}
