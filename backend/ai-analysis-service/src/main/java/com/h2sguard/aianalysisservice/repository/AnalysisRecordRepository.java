package com.h2sguard.aianalysisservice.repository;

import com.h2sguard.aianalysisservice.entity.AnalysisRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnalysisRecordRepository extends JpaRepository<AnalysisRecord, Long> {

    Optional<AnalysisRecord> findByAnalysisId(String analysisId);
}
