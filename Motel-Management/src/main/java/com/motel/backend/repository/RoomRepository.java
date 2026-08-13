package com.motel.backend.repository;

import com.motel.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    // 1. Lấy danh sách phòng theo ID dãy trọ
    List<Room> findByMotelId(Long motelId);

    // 2. Đếm số phòng theo ID dãy trọ và Trạng thái (RENTED, EMPTY,...)
    long countByMotelIdAndStatus(Long motelId, String status);

    // 3. Đếm tổng số phòng theo Trạng thái trên toàn hệ thống (Dùng cho Dashboard Landlord tổng quan)
    long countByStatus(String status);

    // 4. (Tùy chọn) Lấy danh sách phòng thuộc về 1 Chủ trọ dựa trên userId của dãy trọ
    List<Room> findByMotelUserId(Long userId);

    // 5. (Tùy chọn) Đếm số phòng của 1 Chủ trọ theo trạng thái
    long countByMotelUserIdAndStatus(Long userId, String status);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.status = :status AND r.motel.user.id = :userId")
    long countByStatusAndUserId(@Param("status") String status, @Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.motel.user.id = :userId")
    long countTotalByUserId(@Param("userId") Long userId);

    boolean existsByMotelIdAndRoomCode(Long motelId, String roomCode);

}