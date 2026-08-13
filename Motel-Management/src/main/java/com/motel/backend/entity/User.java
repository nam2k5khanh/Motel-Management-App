package com.motel.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Thông tin đăng nhập ---
    @Column(unique = true)
    private String username;
    private String password;
    private String role; // "ADMIN", "MANAGER", "TENANT"
    private String status; // "ACTIVE", "INACTIVE"

    // --- Thông tin cá nhân chung ---
    private String fullName;
    private String phone;
    private String email;

    // --- Thông tin đặc thù của Khách thuê (Tenant) ---
    private String cccd;
    private String gender; // "NAM", "NU", "KHAC"
    private LocalDate birthday;
    private String address;
    private String emergencyContact;
}