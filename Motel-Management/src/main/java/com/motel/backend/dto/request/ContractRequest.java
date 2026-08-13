package com.motel.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ContractRequest {
    private Long tenantId;
    private Long roomId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal depositAmount;
    private BigDecimal rentPrice;
    private String status;
}