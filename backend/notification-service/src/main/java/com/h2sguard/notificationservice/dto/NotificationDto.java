package com.h2sguard.notificationservice.dto;

import com.h2sguard.notificationservice.entity.Notification;
import com.h2sguard.notificationservice.entity.NotificationType;

import java.time.LocalDateTime;

public class NotificationDto {

    private Long id;
    private String recipientUserId;
    private NotificationType notificationType;
    private String title;
    private String message;
    private String referenceId;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NotificationDto() {}

    public NotificationDto(Long id, String recipientUserId, NotificationType notificationType,
                           String title, String message, String referenceId, boolean read,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.recipientUserId = recipientUserId;
        this.notificationType = notificationType;
        this.title = title;
        this.message = message;
        this.referenceId = referenceId;
        this.read = read;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static NotificationDto fromEntity(Notification notification) {
        if (notification == null) return null;
        return NotificationDto.builder()
                .id(notification.getId())
                .recipientUserId(notification.getRecipientUserId())
                .notificationType(notification.getNotificationType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(String recipientUserId) { this.recipientUserId = recipientUserId; }

    public NotificationType getNotificationType() { return notificationType; }
    public void setNotificationType(NotificationType notificationType) { this.notificationType = notificationType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String recipientUserId;
        private NotificationType notificationType;
        private String title;
        private String message;
        private String referenceId;
        private boolean read;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder recipientUserId(String recipientUserId) { this.recipientUserId = recipientUserId; return this; }
        public Builder notificationType(NotificationType notificationType) { this.notificationType = notificationType; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder referenceId(String referenceId) { this.referenceId = referenceId; return this; }
        public Builder read(boolean read) { this.read = read; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public NotificationDto build() {
            return new NotificationDto(id, recipientUserId, notificationType, title, message, referenceId, read, createdAt, updatedAt);
        }
    }
}
