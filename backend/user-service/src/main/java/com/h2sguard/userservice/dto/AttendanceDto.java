package com.h2sguard.userservice.dto;

import com.h2sguard.userservice.entity.AttendanceRecord;
import java.time.LocalDateTime;

public class AttendanceDto {
    private Long id;
    private String workerId;
    private String workerName;
    private String shiftName;
    private String checkInDate;
    private String checkInTime;
    private String department;
    private LocalDateTime createdAt;

    public AttendanceDto() {}

    public AttendanceDto(Long id, String workerId, String workerName, String shiftName,
                         String checkInDate, String checkInTime, String department, LocalDateTime createdAt) {
        this.id = id;
        this.workerId = workerId;
        this.workerName = workerName;
        this.shiftName = shiftName;
        this.checkInDate = checkInDate;
        this.checkInTime = checkInTime;
        this.department = department;
        this.createdAt = createdAt;
    }

    public static AttendanceDto fromEntity(AttendanceRecord record) {
        if (record == null) return null;
        return new AttendanceDto(
                record.getId(),
                record.getWorkerId(),
                record.getWorkerName(),
                record.getShiftName(),
                record.getCheckInDate(),
                record.getCheckInTime(),
                record.getDepartment(),
                record.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getWorkerId() { return workerId; }
    public void setWorkerId(String workerId) { this.workerId = workerId; }

    public String getWorkerName() { return workerName; }
    public void setWorkerName(String workerName) { this.workerName = workerName; }

    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }

    public String getCheckInDate() { return checkInDate; }
    public void setCheckInDate(String checkInDate) { this.checkInDate = checkInDate; }

    public String getCheckInTime() { return checkInTime; }
    public void setCheckInTime(String checkInTime) { this.checkInTime = checkInTime; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
