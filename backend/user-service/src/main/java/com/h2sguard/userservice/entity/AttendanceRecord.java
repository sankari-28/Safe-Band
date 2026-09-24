package com.h2sguard.userservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false, length = 50)
    private String workerId;

    @Column(name = "worker_name", nullable = false, length = 100)
    private String workerName;

    @Column(name = "shift_name", nullable = false, length = 100)
    private String shiftName;

    @Column(name = "check_in_date", nullable = false, length = 20)
    private String checkInDate;

    @Column(name = "check_in_time", nullable = false, length = 30)
    private String checkInTime;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public AttendanceRecord() {}

    public AttendanceRecord(Long id, String workerId, String workerName, String shiftName,
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
