package com.h2sguard.aianalysisservice.service;

import com.h2sguard.aianalysisservice.dto.AnalysisResponse;
import com.h2sguard.aianalysisservice.entity.AnalysisRecord;
import com.h2sguard.aianalysisservice.exception.BadRequestException;
import com.h2sguard.aianalysisservice.repository.AnalysisRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiAnalysisServiceImpl implements AiAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisServiceImpl.class);

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/jpg"
    );

    private final AnalysisRecordRepository recordRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.inference.url:http://localhost:5000/api/analysis}")
    private String aiInferenceUrl;

    public AiAnalysisServiceImpl(AnalysisRecordRepository recordRepository) {
        this.recordRepository = recordRepository;
        this.restTemplate = new RestTemplate();
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
        double predictedPpm;
        boolean isMock = false;
        String status = "PROCESSED";
        String message;

        try {
            // Forward image to Python FastAPI AI Inference Service
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "sensor_image.png";
                }
            };
            body.add("file", fileResource);
            body.add("workerId", workerId != null ? workerId : "ANONYMOUS");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(aiInferenceUrl, requestEntity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> resBody = response.getBody();
                Number ppmNum = (Number) resBody.get("predictedPpm");
                predictedPpm = ppmNum != null ? ppmNum.doubleValue() : 0.0;
                status = (String) resBody.getOrDefault("status", "PROCESSED");
                message = (String) resBody.getOrDefault("message", "AI analysis complete via OpenCV + Random Forest.");
                isMock = Boolean.TRUE.equals(resBody.get("isMock"));
            } else {
                throw new RuntimeException("AI inference service returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.warn("Direct AI inference call to '{}' failed or timed out: {}. Falling back to baseline simulation.", aiInferenceUrl, e.getMessage());
            predictedPpm = Math.round((5.0 + Math.random() * 20.0) * 10.0) / 10.0;
            status = "COMPLETED_MOCK_FALLBACK";
            message = "AI service offline. Generated baseline simulation.";
            isMock = true;
        }

        AnalysisRecord record = AnalysisRecord.builder()
                .analysisId(analysisId)
                .workerId(workerId != null ? workerId : "ANONYMOUS")
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "sensor_image.png")
                .fileSize(file.getSize())
                .contentType(contentType)
                .mockPredictedPpm(predictedPpm)
                .status(status)
                .build();

        recordRepository.save(record);

        return AnalysisResponse.builder()
                .analysisId(analysisId)
                .workerId(record.getWorkerId())
                .fileName(record.getFileName())
                .fileSize(record.getFileSize())
                .contentType(record.getContentType())
                .predictedPpm(predictedPpm)
                .status(status)
                .message(message)
                .isMock(isMock)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
