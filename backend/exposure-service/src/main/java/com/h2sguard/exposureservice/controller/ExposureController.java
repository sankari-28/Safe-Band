package com.h2sguard.exposureservice.controller;

import com.h2sguard.exposureservice.dto.*;
import com.h2sguard.exposureservice.service.ExposureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exposures")
@Tag(name = "Exposure Management", description = "Endpoints for exposure thresholds, history, and consultation workflows")
@SecurityRequirement(name = "bearerAuth")
public class ExposureController {

    private final ExposureService exposureService;

    public ExposureController(ExposureService exposureService) {
        this.exposureService = exposureService;
    }

    @GetMapping("/threshold")
    @Operation(summary = "Get current persistent exposure threshold values")
    public ResponseEntity<ExposureThresholdDto> getThreshold() {
        return ResponseEntity.ok(exposureService.getThreshold());
    }

    @PutMapping("/threshold")
    @PreAuthorize("hasRole('SAFETY_OFFICER')")
    @Operation(summary = "Update exposure thresholds (SAFETY_OFFICER only)")
    public ResponseEntity<ExposureThresholdDto> updateThreshold(Authentication authentication,
                                                                 @Valid @RequestBody UpdateThresholdRequest request) {
        String officerId = authentication.getName();
        return ResponseEntity.ok(exposureService.updateThreshold(request, officerId));
    }

    @PostMapping
    @Operation(summary = "Create a new exposure record from predicted PPM")
    public ResponseEntity<ExposureRecordDto> recordExposure(@Valid @RequestBody CreateExposureRequest request) {
        ExposureRecordDto created = exposureService.recordExposure(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "View current authenticated worker's exposure history")
    public ResponseEntity<List<ExposureRecordDto>> getMyExposures(Authentication authentication) {
        String workerId = authentication.getName();
        return ResponseEntity.ok(exposureService.getWorkerExposures(workerId));
    }

    @GetMapping("/my/{exposureId}")
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "View details of current worker's own exposure record")
    public ResponseEntity<ExposureRecordDto> getMyExposureDetail(Authentication authentication,
                                                                  @PathVariable Long exposureId) {
        String workerId = authentication.getName();
        ExposureRecordDto record = exposureService.getExposureDetails(exposureId);
        
        // Strict worker isolation check
        if (!record.getWorkerId().equals(workerId)) {
            throw new AccessDeniedException("Workers are not allowed to view other workers' exposure details");
        }
        return ResponseEntity.ok(record);
    }

    @GetMapping("/worker/{workerId}")
    @PreAuthorize("hasAnyRole('SAFETY_OFFICER', 'ADMIN')")
    @Operation(summary = "View worker exposure history (SAFETY_OFFICER, ADMIN)")
    public ResponseEntity<List<ExposureRecordDto>> getWorkerExposures(@PathVariable String workerId) {
        return ResponseEntity.ok(exposureService.getWorkerExposures(workerId));
    }

    @GetMapping("/high-risk")
    @PreAuthorize("hasAnyRole('SAFETY_OFFICER', 'ADMIN')")
    @Operation(summary = "View all high-risk worker exposure records")
    public ResponseEntity<List<ExposureRecordDto>> getHighRiskExposures() {
        return ResponseEntity.ok(exposureService.getHighRiskExposures());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SAFETY_OFFICER', 'ADMIN')")
    @Operation(summary = "View all exposure records (SAFETY_OFFICER, ADMIN)")
    public ResponseEntity<List<ExposureRecordDto>> getAllExposures() {
        return ResponseEntity.ok(exposureService.getAllExposures());
    }

    @PutMapping("/{exposureId}/consult")
    @PreAuthorize("hasRole('SAFETY_OFFICER')")
    @Operation(summary = "Mark high-risk exposure as CONSULTED (SAFETY_OFFICER only)")
    public ResponseEntity<ExposureRecordDto> consultExposure(Authentication authentication,
                                                              @PathVariable Long exposureId) {
        String officerId = authentication.getName();
        return ResponseEntity.ok(exposureService.consultExposure(exposureId, officerId));
    }
}
