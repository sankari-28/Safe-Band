package com.h2sguard.userservice.service;

import com.h2sguard.userservice.dto.CreateUserRequest;
import com.h2sguard.userservice.dto.UpdateProfileRequest;
import com.h2sguard.userservice.dto.UserDto;
import com.h2sguard.userservice.entity.Role;
import com.h2sguard.userservice.entity.User;

import java.util.List;

public interface UserService {

    UserDto createUser(CreateUserRequest request);

    UserDto getUserByUserId(String userId);

    User getUserEntityByUserId(String userId);

    List<UserDto> getAllUsers();

    List<UserDto> getUsersByRole(Role role);

    UserDto updateUserProfile(String userId, UpdateProfileRequest request);

    void deactivateUser(String userId);
}
