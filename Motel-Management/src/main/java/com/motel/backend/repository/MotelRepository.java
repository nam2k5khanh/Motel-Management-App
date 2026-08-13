package com.motel.backend.repository;

import com.motel.backend.entity.Motel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MotelRepository extends JpaRepository<Motel, Long> {
    List<Motel> findByUserId(String userId);
    Optional<Motel> findByInviteCodeIgnoreCase(String inviteCode);
    boolean existsByInviteCode(String inviteCode);

}