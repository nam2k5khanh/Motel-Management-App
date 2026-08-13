package com.motel.backend.dto.request;

import lombok.Data;

@Data
public class UserRequest {
    private String fullName;
    private String phone;
    private String email;
    private String address;
    private String cccd;
    private String gender;
    private String emergencyContact;
}