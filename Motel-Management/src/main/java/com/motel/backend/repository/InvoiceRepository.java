package com.motel.backend.repository;

import com.motel.backend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findById(Long id);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i " +
            "WHERE i.status = 'PAID' AND i.month = :month AND i.year = :year " +
            "AND (:userId IS NULL OR i.room.motel.user.id = :userId)")
    Double calculateMonthlyRevenue(
            @Param("month") Integer month,
            @Param("year") Integer year,
            @Param("userId") Long userId
    );

    List<Invoice> findByContractId(Long contractId);

    // Lấy danh sách hóa đơn theo ID Dãy trọ, Tháng và Năm
    @Query("SELECT i FROM Invoice i WHERE " +
            "(:motelId IS NULL OR i.room.motel.id = :motelId OR i.contract.room.motel.id = :motelId) AND " +
            "(:month IS NULL OR i.month = :month) AND " +
            "(:year IS NULL OR i.year = :year)")
    List<Invoice> findByRoomMotelIdAndMonthAndYear(
            @Param("motelId") Long motelId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );

    @Query("SELECT i FROM Invoice i WHERE i.contract.tenant.id = :tenantId ORDER BY i.id DESC")
    Optional<Invoice> findLatestByTenantId(@Param("tenantId") Long tenantId);

    // Tìm hóa đơn của 1 phòng cụ thể trong tháng/năm (hỗ trợ kiểm tra xem phòng đó đã được tạo hóa đơn chưa)
    boolean existsByRoomIdAndMonthAndYear(Long roomId, Integer month, Integer year);
}