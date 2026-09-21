package com.h2sguard.aianalysisservice.service;

import com.h2sguard.aianalysisservice.dto.AnalysisResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AiAnalysisService {

    AnalysisResponse processImageAnalysis(MultipartFile file, String workerId);
}
