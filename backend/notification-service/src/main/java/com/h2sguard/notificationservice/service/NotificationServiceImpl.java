package com.h2sguard.notificationservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.h2sguard.notificationservice.dto.CreateNotificationRequest;
import com.h2sguard.notificationservice.dto.NotificationDto;
import com.h2sguard.notificationservice.entity.Notification;
import com.h2sguard.notificationservice.exception.ResourceNotFoundException;
import com.h2sguard.notificationservice.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final HttpClient httpClient;
    private final String userServiceUrl;
    private final ObjectMapper objectMapper;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            @Value("${user-service.url:http://localhost:8082}") String userServiceUrl) {
        this.notificationRepository = notificationRepository;
        this.userServiceUrl = userServiceUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    @Transactional
    public NotificationDto createNotification(CreateNotificationRequest request) {
        Notification notification = Notification.builder()
                .recipientUserId(request.getRecipientUserId())
                .notificationType(request.getNotificationType())
                .title(request.getTitle())
                .message(request.getMessage())
                .referenceId(request.getReferenceId())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return NotificationDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(String userId) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationDto markAsRead(Long notificationId, String authenticatedUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));

        if (!notification.getRecipientUserId().equals(authenticatedUserId)) {
            throw new AccessDeniedException("User is not authorized to modify another worker's notification");
        }

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        return NotificationDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsReadByRecipientUserId(userId);
    }

    @Override
    @Transactional
    public void broadcastToRole(String role, CreateNotificationRequest request) {
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(userServiceUrl + "/api/users/internal/by-role?role=" + role))
                    .GET()
                    .timeout(Duration.ofSeconds(4))
                    .build();

            HttpResponse<String> resp = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200 && resp.body() != null) {
                JsonNode root = objectMapper.readTree(resp.body());
                if (root.isArray()) {
                    for (JsonNode node : root) {
                        String recipientId = node.path("userId").asText();
                        if (recipientId != null && !recipientId.isBlank()) {
                            Notification notification = Notification.builder()
                                    .recipientUserId(recipientId)
                                    .notificationType(request.getNotificationType())
                                    .title(request.getTitle())
                                    .message(request.getMessage())
                                    .referenceId(request.getReferenceId())
                                    .read(false)
                                    .build();
                            notificationRepository.save(notification);
                            log.info("Broadcast alert '{}' saved for role {} user: {}", request.getTitle(), role, recipientId);
                        }
                    }
                }
            } else {
                log.warn("user-service returned status {} when querying role {}", resp.statusCode(), role);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast alert to role {}: {}", role, e.getMessage());
        }
    }
}
