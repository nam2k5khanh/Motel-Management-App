package com.motel.backend.repository;

import com.motel.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Lấy tất cả thông báo của 1 user theo thứ tự mới nhất
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Đếm số thông báo chưa đọc
    long countByUserIdAndIsReadFalse(Long userId);
}