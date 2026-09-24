package com.h2sguard.userservice.dto;

import jakarta.validation.constraints.NotBlank;

public class CheckInRequest {

    @NotBlank(message = "Shift selection is required")
    private String shiftName;

    private String department;

    public CheckInRequest() {}

    public CheckInRequest(String shiftName, String department) {
        this.shiftName = shiftName;
        this.department = department;
    }

    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
