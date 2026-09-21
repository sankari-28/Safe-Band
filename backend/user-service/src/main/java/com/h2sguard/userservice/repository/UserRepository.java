package com.h2sguard.userservice.repository;

import com.h2sguard.userservice.entity.Role;
import com.h2sguard.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUserId(String userId);

    Optional<User> findByEmail(String email);

    boolean existsByUserId(String userId);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);
}
