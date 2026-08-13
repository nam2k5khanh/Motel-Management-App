package com.motel.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoiceDTO {
    private Long id;
    private Long roomId;
    private Long contractId;
    private Long electricityWaterId;
    private Integer month;
    private Integer year;
    private BigDecimal roomFee;
    private BigDecimal electricFee;
    private BigDecimal waterFee;
    private BigDecimal otherFee;
    private BigDecimal total;
    private String status; // 'UNPAID', 'PAID'
}