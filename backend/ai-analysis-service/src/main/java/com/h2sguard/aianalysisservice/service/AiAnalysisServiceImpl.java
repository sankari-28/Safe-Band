package com.h2sguard.aianalysisservice.service;

import com.h2sguard.aianalysisservice.dto.AnalysisResponse;
import com.h2sguard.aianalysisservice.entity.AnalysisRecord;
import com.h2sguard.aianalysisservice.exception.BadRequestException;
import com.h2sguard.aianalysisservice.repository.AnalysisRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AiAnalysisServiceImpl implements AiAnalysisService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/jpg"
    );

    private final AnalysisRecordRepository recordRepository;

    public AiAnalysisServiceImpl(AnalysisRecordRepository recordRepository) {
        this.recordRepository = recordRepository;
    }

    @Override
    @Transactional
    public AnalysisResponse processImageAnalysis(MultipartFile file, String workerId) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded image file cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file type: '" + contentType + "'. Only JPEG, PNG, and WebP images are allowed.");
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10 MB limit
            throw new BadRequestException("Image file size exceeds maximum 10MB limit");
        }

        String analysisId = "ANL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Architectural Placeholder: generates safe test PPM simulation range for backend pipeline verification
        // Official production classification is strictly performed by Exposure Service
        double mockPpm = Math.round((5.0 + Math.random() * 20.0) * 10.0) / 10.0;

        AnalysisRecord record = AnalysisRecord.builder()
                .analysisId(analysisId)
                .workerId(workerId != null ? workerId : "ANONYMOUS")
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "sensor_image.png")
                .fileSize(file.getSize())
                .contentType(contentType)
                .mockPredictedPpm(mockPpm)
                .status("COMPLETED_MOCK_BOUNDARY")
                .build();

        recordRepository.save(record);

        return AnalysisResponse.builder()
                .analysisId(analysisId)
                .workerId(record.getWorkerId())
                .fileName(record.getFileName())
                .fileSize(record.getFileSize())
                .contentType(record.getContentType())
                .predictedPpm(mockPpm)
                .status("PROCESSED")
                .message("Image analyzed successfully. Ready for exposure threshold evaluation.")
                .isMock(true)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
