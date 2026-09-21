package com.h2sguard.notificationservice.service;

import com.h2sguard.notificationservice.dto.CreateNotificationRequest;
import com.h2sguard.notificationservice.dto.NotificationDto;
import com.h2sguard.notificationservice.entity.Notification;
import com.h2sguard.notificationservice.exception.ResourceNotFoundException;
import com.h2sguard.notificationservice.repository.NotificationRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
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
}
