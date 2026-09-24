package com.h2sguard.userservice.controller;

import com.h2sguard.userservice.dto.*;
import com.h2sguard.userservice.entity.Role;
import com.h2sguard.userservice.entity.User;
import com.h2sguard.userservice.service.AttendanceService;
import com.h2sguard.userservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "Endpoints for viewing and managing worker, safety officer, and admin profiles")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final AttendanceService attendanceService;

    public UserController(UserService userService, AttendanceService attendanceService) {
        this.userService = userService;
        this.attendanceService = attendanceService;
    }

    @GetMapping("/me")
    @Operation(summary = "View current authenticated user profile")
    public ResponseEntity<UserDto> getMyProfile(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(userService.getUserByUserId(userId));
    }

    @PutMapping("/me")
    @Operation(summary = "Update personal profile information")
    public ResponseEntity<UserDto> updateMyProfile(Authentication authentication,
                                                   @Valid @RequestBody UpdateProfileRequest request) {
        String userId = authentication.getName();
        return ResponseEntity.ok(userService.updateUserProfile(userId, request));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SAFETY_OFFICER', 'ADMIN')")
    @Operation(summary = "View all system users (SAFETY_OFFICER, ADMIN only)")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/workers")
    @PreAuthorize("hasAnyRole('SAFETY_OFFICER', 'ADMIN')")
    @Operation(summary = "View all workers (SAFETY_OFFICER, ADMIN only)")
    public ResponseEntity<List<UserDto>> getWorkers() {
        return ResponseEntity.ok(userService.getUsersByRole(Role.WORKER));
    }

    @GetMapping("/safety-officers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "View all safety officers (ADMIN only)")
    public ResponseEntity<List<UserDto>> getSafetyOfficers() {
        return ResponseEntity.ok(userService.getUsersByRole(Role.SAFETY_OFFICER));
    }

    @PostMapping("/workers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new worker (ADMIN only)")
    public ResponseEntity<UserDto> createWorker(@Valid @RequestBody CreateUserRequest request) {
        request.setRole(Role.WORKER);
        UserDto created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/safety-officers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new safety officer (ADMIN only)")
    public ResponseEntity<UserDto> createSafetyOfficer(@Valid @RequestBody CreateUserRequest request) {
        request.setRole(Role.SAFETY_OFFICER);
        UserDto created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate worker account (ADMIN only)")
    public ResponseEntity<Void> deactivateUser(@PathVariable String userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    // --- ATTENDANCE WORKFLOW ENDPOINTS ---

    @PostMapping("/attendance/check-in")
    @Operation(summary = "Record worker daily attendance check-in and shift selection")
    public ResponseEntity<AttendanceDto> checkIn(Authentication authentication,
                                                 @Valid @RequestBody CheckInRequest request) {
        String workerId = authentication.getName();
        AttendanceDto dto = attendanceService.checkIn(workerId, request);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/attendance/today")
    @Operation(summary = "Get current authenticated worker's check-in status for today")
    public ResponseEntity<AttendanceDto> getTodayAttendance(Authentication authentication) {
        String workerId = authentication.getName();
        AttendanceDto dto = attendanceService.getTodayAttendance(workerId);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/attendance/all-today")
    @PreAuthorize("hasAnyRole('SAFETY_OFFICER', 'ADMIN')")
    @Operation(summary = "View all workers checked in today (SAFETY_OFFICER, ADMIN)")
    public ResponseEntity<List<AttendanceDto>> getAllTodayAttendance() {
        return ResponseEntity.ok(attendanceService.getAllTodayAttendance());
    }

    // --- INTERNAL MICROSERVICE ENDPOINTS ---

    @GetMapping("/internal/{userId}")
    @Operation(summary = "Internal user details verification endpoint for microservice communication")
    public ResponseEntity<User> getInternalUserEntity(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUserEntityByUserId(userId));
    }

    @GetMapping("/internal/by-role")
    @Operation(summary = "Internal endpoint to get all active users by role for broadcasting")
    public ResponseEntity<List<UserDto>> getInternalUsersByRole(@RequestParam String role) {
        Role parsedRole = Role.valueOf(role.toUpperCase());
        return ResponseEntity.ok(userService.getUsersByRole(parsedRole));
    }
}
