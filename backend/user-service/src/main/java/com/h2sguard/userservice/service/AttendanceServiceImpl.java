package com.h2sguard.userservice.service;

import com.h2sguard.userservice.dto.AttendanceDto;
import com.h2sguard.userservice.dto.CheckInRequest;
import com.h2sguard.userservice.entity.AttendanceRecord;
import com.h2sguard.userservice.entity.User;
import com.h2sguard.userservice.exception.DuplicateResourceException;
import com.h2sguard.userservice.repository.AttendanceRepository;
import com.h2sguard.userservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceServiceImpl.class);

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final HttpClient httpClient;
    private final String notificationServiceUrl;

    public AttendanceServiceImpl(
            AttendanceRepository attendanceRepository,
            UserRepository userRepository,
            @Value("${notification-service.url:http://localhost:8084}") String notificationServiceUrl) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.notificationServiceUrl = notificationServiceUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    @Override
    @Transactional
    public AttendanceDto checkIn(String workerId, CheckInRequest request) {
        String todayDate = LocalDate.now().toString();

        // 1. Prevent duplicate check-ins for the same day
        Optional<AttendanceRecord> existing = attendanceRepository.findByWorkerIdAndCheckInDate(workerId, todayDate);
        if (existing.isPresent()) {
            log.warn("Worker {} already checked in for today ({}) with {}", workerId, todayDate, existing.get().getShiftName());
            throw new DuplicateResourceException("Worker " + workerId + " already checked in for today (" + todayDate + ") with " + existing.get().getShiftName());
        }

        // 2. Resolve worker details
        String workerName = workerId;
        String dept = request.getDepartment();
        Optional<User> userOpt = userRepository.findByUserId(workerId);
        if (userOpt.isPresent()) {
            workerName = userOpt.get().getFullName();
            if (dept == null || dept.isBlank()) {
                dept = userOpt.get().getDepartment();
            }
        }
        if (dept == null || dept.isBlank()) {
            dept = "Operations";
        }

        String checkInTime = LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a"));

        AttendanceRecord record = new AttendanceRecord();
        record.setWorkerId(workerId);
        record.setWorkerName(workerName);
        record.setShiftName(request.getShiftName());
        record.setCheckInDate(todayDate);
        record.setCheckInTime(checkInTime);
        record.setDepartment(dept);

        AttendanceRecord saved = attendanceRepository.save(record);

        // 3. Notify Safety Officers
        notifySafetyOfficersOnCheckIn(saved);

        return AttendanceDto.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceDto getTodayAttendance(String workerId) {
        String todayDate = LocalDate.now().toString();
        return attendanceRepository.findByWorkerIdAndCheckInDate(workerId, todayDate)
                .map(AttendanceDto::fromEntity)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceDto> getAllTodayAttendance() {
        String todayDate = LocalDate.now().toString();
        return attendanceRepository.findByCheckInDateOrderByCheckInTimeDesc(todayDate).stream()
                .map(AttendanceDto::fromEntity)
                .collect(Collectors.toList());
    }

    private void notifySafetyOfficersOnCheckIn(AttendanceRecord record) {
        CompletableFuture.runAsync(() -> {
            try {
                String payload = String.format(
                        "{\"recipientUserId\":\"ROLE_BROADCAST\",\"notificationType\":\"ATTENDANCE_CHECKIN\",\"title\":\"Worker Shift Check-In\",\"message\":\"Worker %s (%s) checked in for %s in %s.\",\"referenceId\":\"%s\"}",
                        record.getWorkerName(),
                        record.getWorkerId(),
                        record.getShiftName(),
                        record.getDepartment(),
                        record.getId()
                );

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(notificationServiceUrl + "/api/notifications/internal/broadcast-role?role=SAFETY_OFFICER"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .timeout(Duration.ofSeconds(4))
                        .build();

                httpClient.send(httpRequest, HttpResponse.BodyHandlers.discarding());
                log.info("Dispatched attendance check-in notification for worker {}", record.getWorkerId());
            } catch (Exception e) {
                log.warn("Could not dispatch shift check-in notification to safety officers: {}", e.getMessage());
            }
        });
    }
}
