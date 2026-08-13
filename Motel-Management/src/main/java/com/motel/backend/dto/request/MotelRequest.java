package com.motel.backend.dto.request;

import com.motel.backend.entity.User;
import lombok.Data;

@Data
public class MotelRequest {
    String name;
    String address;
    String description;
    Long userId;
}
