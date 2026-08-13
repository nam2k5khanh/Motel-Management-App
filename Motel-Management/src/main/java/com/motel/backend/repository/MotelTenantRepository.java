package com.motel.backend.repository;

import com.motel.backend.entity.MotelTenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MotelTenantRepository extends JpaRepository<MotelTenant, Long> {

    // Kiểm tra xem User này đã gửi yêu cầu PENDING hoặc đang ACTIVE trong hệ thống chưa
    boolean existsByTenantIdAndStatus(Long tenantId, MotelTenant.Status status);

    List<MotelTenant> findByTenantId(Long tenantId);

    List<MotelTenant> findByMotelId(Long motelId);

    List<MotelTenant> findByMotelIdAndStatus(Long motelId, String status);
    // Lấy yêu cầu PENDING gần nhất của Khách thuê
    Optional<MotelTenant> findFirstByTenantIdAndStatusOrderByIdDesc(Long tenantId, MotelTenant.Status status);

    boolean existsByTenantIdAndMotelId(Long tenantId, Long motelId);

    Optional<MotelTenant> findByTenantIdAndMotelId(Long tenantId, Long motelId);


}