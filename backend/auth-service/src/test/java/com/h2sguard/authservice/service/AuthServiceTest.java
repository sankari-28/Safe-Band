package com.h2sguard.authservice.service;

import com.h2sguard.authservice.dto.AuthResponse;
import com.h2sguard.authservice.dto.LoginRequest;
import com.h2sguard.authservice.entity.AuthCredential;
import com.h2sguard.authservice.exception.InvalidCredentialsException;
import com.h2sguard.authservice.repository.AuthCredentialRepository;
import com.h2sguard.authservice.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthCredentialRepository credentialRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private AuthCredential sampleCredential;

    @BeforeEach
    void setUp() {
        sampleCredential = AuthCredential.builder()
                .id(1L)
                .userId("W001")
                .passwordHash("hashedPass")
                .role("WORKER")
                .active(true)
                .build();
    }

    @Test
    void login_Success() {
        LoginRequest req = new LoginRequest("W001", "password123");

        when(credentialRepository.findByUserId("W001")).thenReturn(Optional.of(sampleCredential));
        when(passwordEncoder.matches("password123", "hashedPass")).thenReturn(true);
        when(jwtProvider.generateToken("W001", "WORKER")).thenReturn("mockedJwtToken");

        AuthResponse res = authService.login(req);

        assertNotNull(res);
        assertEquals("mockedJwtToken", res.getAccessToken());
        assertEquals("W001", res.getUserId());
        assertEquals("WORKER", res.getRole());
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        LoginRequest req = new LoginRequest("W001", "wrongPass");

        when(credentialRepository.findByUserId("W001")).thenReturn(Optional.of(sampleCredential));
        when(passwordEncoder.matches("wrongPass", "hashedPass")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        LoginRequest req = new LoginRequest("UNKNOWN", "password123");

        when(credentialRepository.findByUserId("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }
}
