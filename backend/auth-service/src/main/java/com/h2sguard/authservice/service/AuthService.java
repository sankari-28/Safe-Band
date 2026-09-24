package com.h2sguard.authservice.service;

import com.h2sguard.authservice.dto.AuthResponse;
import com.h2sguard.authservice.dto.LoginRequest;
import com.h2sguard.authservice.dto.ValidateTokenResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    ValidateTokenResponse validateToken(String token);

    void createOrUpdateCredential(String userId, String rawPassword, String role);
}
