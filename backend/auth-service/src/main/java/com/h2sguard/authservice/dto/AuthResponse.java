package com.h2sguard.authservice.dto;

public class AuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private String userId;
    private String role;

    public AuthResponse() {}

    public AuthResponse(String accessToken, String tokenType, String userId, String role) {
        this.accessToken = accessToken;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.userId = userId;
        this.role = role;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String accessToken;
        private String tokenType = "Bearer";
        private String userId;
        private String role;

        public Builder accessToken(String accessToken) { this.accessToken = accessToken; return this; }
        public Builder tokenType(String tokenType) { this.tokenType = tokenType; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }
        public Builder role(String role) { this.role = role; return this; }

        public AuthResponse build() {
            return new AuthResponse(accessToken, tokenType, userId, role);
        }
    }
}
