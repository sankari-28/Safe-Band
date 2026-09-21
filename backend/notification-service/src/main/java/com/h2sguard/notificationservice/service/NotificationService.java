package com.h2sguard.notificationservice.service;

import com.h2sguard.notificationservice.dto.CreateNotificationRequest;
import com.h2sguard.notificationservice.dto.NotificationDto;

import java.util.List;

public interface NotificationService {

    NotificationDto createNotification(CreateNotificationRequest request);

    List<NotificationDto> getUserNotifications(String userId);

    NotificationDto markAsRead(Long notificationId, String authenticatedUserId);
}
