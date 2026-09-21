package com.h2sguard.authservice.repository;

import com.h2sguard.authservice.entity.AuthCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthCredentialRepository extends JpaRepository<AuthCredential, Long> {

    Optional<AuthCredential> findByUserId(String userId);

    boolean existsByUserId(String userId);
}
