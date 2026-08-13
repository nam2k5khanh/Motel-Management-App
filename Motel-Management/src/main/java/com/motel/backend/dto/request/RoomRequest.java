package com.motel.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RoomRequest {
    private String roomCode;
    private BigDecimal area;
    private BigDecimal price;
    private Integer maxPeople;
    private String status;
    private String description;
}