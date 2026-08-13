package com.motel.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElectricityWaterRequest {

    private Long roomId;
    private Integer month;
    private Integer year;
    private Integer oldElectric;
    private Integer newElectric;
    private BigDecimal electricPrice;
    private Integer oldWater;
    private Integer newWater;
    private BigDecimal waterPrice;
    private BigDecimal total;
}