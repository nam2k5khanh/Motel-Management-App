package com.motel.backend.service;
import com.motel.backend.entity.Notification;
import com.motel.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // 1. Tạo mới một thông báo
    public Notification createNotification(Long userId, String title, String message, String type) {
        Notification notification = new Notification(userId, title, message, type);
        return notificationRepository.save(notification);
    }

    // 2. Lấy danh sách tất cả thông báo của 1 user (Sắp xếp mới nhất lên đầu)
    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // 3. Đếm số lượng thông báo chưa đọc của 1 user
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // 4. Đánh dấu 1 thông báo cụ thể là đã đọc
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    // 5. Đánh dấu tất cả thông báo của 1 user là đã đọc
    public void markAllAsRead(Long userId) {
        List<Notification> unreadList = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        unreadList.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadList);
    }
}