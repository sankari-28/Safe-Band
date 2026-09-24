package com.h2sguard.userservice.repository;

import com.h2sguard.userservice.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findByWorkerIdAndCheckInDate(String workerId, String checkInDate);
    List<AttendanceRecord> findByCheckInDateOrderByCheckInTimeDesc(String checkInDate);
}
