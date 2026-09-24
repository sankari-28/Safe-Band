package com.h2sguard.userservice.service;

import com.h2sguard.userservice.dto.AttendanceDto;
import com.h2sguard.userservice.dto.CheckInRequest;
import java.util.List;

public interface AttendanceService {
    AttendanceDto checkIn(String workerId, CheckInRequest request);
    AttendanceDto getTodayAttendance(String workerId);
    List<AttendanceDto> getAllTodayAttendance();
}
