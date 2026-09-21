package com.h2sguard.notificationservice.controller;

import com.h2sguard.notificationservice.dto.CreateNotificationRequest;
import com.h2sguard.notificationservice.dto.NotificationDto;
import com.h2sguard.notificationservice.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notification Management", description = "Endpoints for user notifications and alerts")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/my")
    @Operation(summary = "View current authenticated user's notifications")
    public ResponseEntity<List<NotificationDto>> getMyNotifications(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "View notifications for specified user ID (Worker isolation enforced)")
    public ResponseEntity<List<NotificationDto>> getUserNotifications(Authentication authentication,
                                                                        @PathVariable String userId) {
        String authenticatedUserId = authentication.getName();
        boolean isStaff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SAFETY_OFFICER") || a.getAuthority().equals("ROLE_ADMIN"));

        // Enforce worker isolation
        if (!authenticatedUserId.equals(userId) && !isStaff) {
            throw new AccessDeniedException("Workers are not permitted to view other workers' notification data");
        }

        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<NotificationDto> markAsRead(Authentication authentication,
                                                       @PathVariable Long notificationId) {
        String authenticatedUserId = authentication.getName();
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, authenticatedUserId));
    }

    @PostMapping("/internal")
    @Operation(summary = "Internal microservice endpoint to dispatch notifications")
    public ResponseEntity<NotificationDto> createNotificationInternal(@Valid @RequestBody CreateNotificationRequest request) {
        NotificationDto created = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
