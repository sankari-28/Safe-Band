package com.h2sguard.userservice.service;

import com.h2sguard.userservice.dto.CreateUserRequest;
import com.h2sguard.userservice.dto.UserDto;
import com.h2sguard.userservice.entity.Role;
import com.h2sguard.userservice.entity.User;
import com.h2sguard.userservice.exception.BadRequestException;
import com.h2sguard.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .userId("W001")
                .fullName("John Worker")
                .email("worker@test.com")
                .role(Role.WORKER)
                .passwordHash("hashedPass")
                .active(true)
                .build();
    }

    @Test
    void createUser_Success() {
        CreateUserRequest req = CreateUserRequest.builder()
                .userId("W002")
                .fullName("New Worker")
                .email("new@test.com")
                .password("password123")
                .role(Role.WORKER)
                .build();

        when(userRepository.existsByUserId("W002")).thenReturn(false);
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedSecret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });

        UserDto created = userService.createUser(req);

        assertNotNull(created);
        assertEquals("W002", created.getUserId());
        assertEquals("New Worker", created.getFullName());
        assertEquals(Role.WORKER, created.getRole());
    }

    @Test
    void createUser_DuplicateUserId_ThrowsException() {
        CreateUserRequest req = CreateUserRequest.builder()
                .userId("W001")
                .fullName("Duplicate")
                .email("dup@test.com")
                .password("pass")
                .role(Role.WORKER)
                .build();

        when(userRepository.existsByUserId("W001")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> userService.createUser(req));
    }

    @Test
    void getUserByUserId_Success() {
        when(userRepository.findByUserId("W001")).thenReturn(Optional.of(sampleUser));

        UserDto dto = userService.getUserByUserId("W001");

        assertNotNull(dto);
        assertEquals("W001", dto.getUserId());
        assertEquals("John Worker", dto.getFullName());
    }
}
