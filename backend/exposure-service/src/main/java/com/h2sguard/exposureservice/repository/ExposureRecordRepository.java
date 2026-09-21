package com.h2sguard.exposureservice.repository;

import com.h2sguard.exposureservice.entity.ConsultationStatus;
import com.h2sguard.exposureservice.entity.ExposureLevel;
import com.h2sguard.exposureservice.entity.ExposureRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExposureRecordRepository extends JpaRepository<ExposureRecord, Long> {

    List<ExposureRecord> findByWorkerIdOrderByExposureDateTimeDesc(String workerId);

    List<ExposureRecord> findByExposureLevelOrderByExposureDateTimeDesc(ExposureLevel exposureLevel);

    List<ExposureRecord> findByConsultationStatusOrderByExposureDateTimeDesc(ConsultationStatus consultationStatus);
}
