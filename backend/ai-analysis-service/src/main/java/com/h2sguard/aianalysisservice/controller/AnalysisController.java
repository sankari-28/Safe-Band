package com.h2sguard.aianalysisservice.controller;

import com.h2sguard.aianalysisservice.dto.AnalysisResponse;
import com.h2sguard.aianalysisservice.service.AiAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/analysis")
@Tag(name = "AI Analysis Boundary", description = "REST API boundary for sensor image upload and PPM prediction")
@SecurityRequirement(name = "bearerAuth")
public class AnalysisController {

    private final AiAnalysisService aiAnalysisService;

    public AnalysisController(AiAnalysisService aiAnalysisService) {
        this.aiAnalysisService = aiAnalysisService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload sensor image for H₂S AI analysis")
    public ResponseEntity<AnalysisResponse> analyzeImage(Authentication authentication,
                                                         @RequestParam("file") MultipartFile file) {
        String workerId = (authentication != null) ? authentication.getName() : "ANONYMOUS";
        AnalysisResponse response = aiAnalysisService.processImageAnalysis(file, workerId);
        return ResponseEntity.ok(response);
    }
}
