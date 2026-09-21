package com.h2sguard.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Email(message = "Email must be a valid email address")
    private String email;

    private String phoneNumber;
    private String department;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String fullName, String email, String phoneNumber, String department) {
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.department = department;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String fullName;
        private String email;
        private String phoneNumber;
        private String department;

        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder department(String department) { this.department = department; return this; }

        public UpdateProfileRequest build() {
            return new UpdateProfileRequest(fullName, email, phoneNumber, department);
        }
    }
}
