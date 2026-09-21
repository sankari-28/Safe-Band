package com.h2sguard.notificationservice.service;

import com.h2sguard.notificationservice.dto.CreateNotificationRequest;
import com.h2sguard.notificationservice.dto.NotificationDto;
import com.h2sguard.notificationservice.entity.Notification;
import com.h2sguard.notificationservice.entity.NotificationType;
import com.h2sguard.notificationservice.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private Notification sampleNotification;

    @BeforeEach
    void setUp() {
        sampleNotification = Notification.builder()
                .id(1L)
                .recipientUserId("W001")
                .notificationType(NotificationType.HIGH_EXPOSURE)
                .title("Alert")
                .message("High level detected")
                .read(false)
                .build();
    }

    @Test
    void createNotification_Success() {
        CreateNotificationRequest req = new CreateNotificationRequest(
                "W001", NotificationType.HIGH_EXPOSURE, "Alert", "High level detected", "100"
        );

        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            n.setId(10L);
            return n;
        });

        NotificationDto created = notificationService.createNotification(req);

        assertNotNull(created);
        assertEquals("W001", created.getRecipientUserId());
        assertEquals(NotificationType.HIGH_EXPOSURE, created.getNotificationType());
    }

    @Test
    void markAsRead_Success() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(sampleNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        NotificationDto res = notificationService.markAsRead(1L, "W001");

        assertNotNull(res);
        assertTrue(res.isRead());
    }

    @Test
    void markAsRead_UnauthorizedWorker_ThrowsException() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(sampleNotification));

        assertThrows(AccessDeniedException.class, () -> notificationService.markAsRead(1L, "W002"));
    }
}
