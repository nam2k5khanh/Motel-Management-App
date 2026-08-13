package com.motel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardDTO {
    private double totalRevenue;
    private long rentedRooms;
    private long emptyRooms;
    private long totalRooms;
}