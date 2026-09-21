package com.h2sguard.authservice.dto;

public class ValidateTokenResponse {

    private boolean valid;
    private String userId;
    private String role;

    public ValidateTokenResponse() {}

    public ValidateTokenResponse(boolean valid, String userId, String role) {
        this.valid = valid;
        this.userId = userId;
        this.role = role;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
