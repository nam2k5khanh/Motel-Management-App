package com.motel.backend.repository;
import com.motel.backend.entity.LandlordBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandlordBankRepository extends JpaRepository<LandlordBank, Long> {
    Optional<LandlordBank> findByLandlordId(Long landlordId);
}