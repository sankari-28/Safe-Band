package com.h2sguard.exposureservice.repository;

import com.h2sguard.exposureservice.entity.ExposureThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExposureThresholdRepository extends JpaRepository<ExposureThreshold, Long> {

    Optional<ExposureThreshold> findFirstByOrderByIdDesc();
}
