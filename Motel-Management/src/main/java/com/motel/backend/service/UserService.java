package com.motel.backend.service;

import com.motel.backend.entity.User;
import com.motel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Tiêm PasswordEncoder để mã hóa mật khẩu khi đổi

    // 1. Lấy thông tin User theo ID
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));
    }

    // 2. Cập nhật thông tin cá nhân theo ID
    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);

        if (userDetails.getFullName() != null) {
            user.setFullName(userDetails.getFullName());
        }
        if (userDetails.getPhone() != null) {
            user.setPhone(userDetails.getPhone());
        }
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getAddress() != null) {
            user.setAddress(userDetails.getAddress());
        }
        if (userDetails.getCccd() != null) {
            user.setCccd(userDetails.getCccd());
        }
        if (userDetails.getGender() != null) {
            user.setGender(userDetails.getGender());
        }
        if (userDetails.getEmergencyContact() != null) {
            user.setEmergencyContact(userDetails.getEmergencyContact());
        }

        return userRepository.save(user);
    }

    // 3. Đổi mật khẩu theo ID
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = getUserById(id);

        // Kiểm tra mật khẩu cũ có đúng không
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }

        // Mã hóa mật khẩu mới và lưu lại
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}