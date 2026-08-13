package com.motel.backend.repository;
import com.motel.backend.entity.RepairRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairRequestRepository extends JpaRepository<RepairRequest, Long> {

    // Tìm báo cáo theo người gửi
    List<RepairRequest> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    // Tìm báo cáo theo phòng
    List<RepairRequest> findByRoomIdOrderByCreatedAtDesc(Long roomId);

    List<RepairRequest> findAllByOrderByCreatedAtDesc();


    // Lọc theo trạng thái
    List<RepairRequest> findByStatus(RepairRequest.Status status);
}