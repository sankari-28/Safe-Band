package com.h2sguard.exposureservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    private final WebClient webClient;

    public NotificationClient(@Value("${notification-service.url:http://localhost:8084}") String notificationServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(notificationServiceUrl)
                .build();
    }

    public void sendHighExposureNotification(String workerId, Double ppm, Long exposureId) {
        try {
            Map<String, Object> payload = Map.of(
                    "recipientUserId", workerId,
                    "notificationType", "HIGH_EXPOSURE",
                    "title", "HIGH H₂S EXPOSURE ALERT",
                    "message", String.format("High H₂S level of %.1f PPM detected! Medical consultation required.", ppm),
                    "referenceId", String.valueOf(exposureId)
            );

            webClient.post()
                    .uri("/api/notifications/internal")
                    .bodyValue(payload)
                    .retrieve()
                    .toBodilessEntity()
                    .subscribe(
                            res -> log.info("Notification sent for high exposure ID: {}", exposureId),
                            err -> log.warn("Failed to dispatch notification service alert: {}", err.getMessage())
                    );
        } catch (Exception e) {
            log.warn("Could not dispatch alert to notification service: {}", e.getMessage());
        }
    }
}
