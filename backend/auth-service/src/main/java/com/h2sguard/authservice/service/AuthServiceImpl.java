package com.h2sguard.authservice.service;

import com.h2sguard.authservice.dto.AuthResponse;
import com.h2sguard.authservice.dto.LoginRequest;
import com.h2sguard.authservice.dto.ValidateTokenResponse;
import com.h2sguard.authservice.entity.AuthCredential;
import com.h2sguard.authservice.exception.InvalidCredentialsException;
import com.h2sguard.authservice.repository.AuthCredentialRepository;
import com.h2sguard.authservice.security.JwtProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthCredentialRepository credentialRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthServiceImpl(AuthCredentialRepository credentialRepository,
                           PasswordEncoder passwordEncoder,
                           JwtProvider jwtProvider) {
        this.credentialRepository = credentialRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        AuthCredential credential = credentialRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid user ID or password"));

        if (!credential.isActive()) {
            throw new InvalidCredentialsException("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.getPassword(), credential.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid user ID or password");
        }

        String accessToken = jwtProvider.generateToken(credential.getUserId(), credential.getRole());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .userId(credential.getUserId())
                .role(credential.getRole())
                .build();
    }

    @Override
    public ValidateTokenResponse validateToken(String token) {
        boolean valid = jwtProvider.validateToken(token);
        if (!valid) {
            return new ValidateTokenResponse(false, null, null);
        }
        String userId = jwtProvider.extractUserId(token);
        String role = jwtProvider.extractRole(token);
        return new ValidateTokenResponse(true, userId, role);
    }

    @Override
    @Transactional
    public void createOrUpdateCredential(String userId, String rawPassword, String role) {
        AuthCredential credential = credentialRepository.findByUserId(userId)
                .orElse(new AuthCredential());
        credential.setUserId(userId);
        credential.setPasswordHash(passwordEncoder.encode(rawPassword));
        credential.setRole(role);
        credential.setActive(true);
        credentialRepository.save(credential);
    }
}
