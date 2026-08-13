package com.motel.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ElectricityWaterDTO {
    private Long id;
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