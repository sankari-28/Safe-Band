package com.h2sguard.userservice.service;

import com.h2sguard.userservice.dto.CreateUserRequest;
import com.h2sguard.userservice.dto.UpdateProfileRequest;
import com.h2sguard.userservice.dto.UserDto;
import com.h2sguard.userservice.entity.Role;
import com.h2sguard.userservice.entity.User;
import com.h2sguard.userservice.exception.BadRequestException;
import com.h2sguard.userservice.exception.ResourceNotFoundException;
import com.h2sguard.userservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByUserId(request.getUserId())) {
            throw new BadRequestException("User ID '" + request.getUserId() + "' already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email '" + request.getEmail() + "' is already registered");
        }

        User user = User.builder()
                .userId(request.getUserId())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .department(request.getDepartment())
                .role(request.getRole())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        return UserDto.fromEntity(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserByUserId(String userId) {
        User user = getUserEntityByUserId(userId);
        return UserDto.fromEntity(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserEntityByUserId(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDto updateUserProfile(String userId, UpdateProfileRequest request) {
        User user = getUserEntityByUserId(userId);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank() && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email '" + request.getEmail() + "' is already registered");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        User updatedUser = userRepository.save(user);
        return UserDto.fromEntity(updatedUser);
    }

    @Override
    @Transactional
    public void deactivateUser(String userId) {
        User user = getUserEntityByUserId(userId);
        user.setActive(false);
        userRepository.save(user);
    }
}
