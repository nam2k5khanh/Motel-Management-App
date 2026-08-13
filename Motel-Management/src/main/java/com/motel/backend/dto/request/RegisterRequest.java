package com.motel.backend.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String cccd;
    private String gender;
    private String emergencyContact;
    private String role;
}