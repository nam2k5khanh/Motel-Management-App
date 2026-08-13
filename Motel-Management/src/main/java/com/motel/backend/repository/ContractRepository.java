package com.motel.backend.repository;

import com.motel.backend.entity.Contract;
import com.motel.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByTenantId(Long tenantId);
    Contract findByTenantIdAndStatus(Long id, String status);
    Contract findByRoomIdAndStatus(Long roomId, String status);
    List<Contract> findByStatus(String status);
    List<Contract> findByRoomMotelIdAndStatus(Long motelId, String status);

    @Query(value = "SELECT m.user_id FROM contracts c " +
            "JOIN rooms r ON c.room_id = r.id " +
            "JOIN motels m ON r.motel_id = m.id " +
            "WHERE c.id = :contractId", nativeQuery = true)
    Long findLandlordIdByContractId(@Param("contractId") Long contractId);
}