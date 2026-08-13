package com.motel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "month")
    private Integer month;

    @Column(name = "year")
    private Integer year;

    @Column(name = "room_fee", precision = 12, scale = 2)
    private BigDecimal roomFee;

    @Column(name = "electric_fee", precision = 12, scale = 2)
    private BigDecimal electricFee;

    @Column(name = "water_fee", precision = 12, scale = 2)
    private BigDecimal waterFee;

    @Column(name = "other_fee", precision = 12, scale = 2)
    private BigDecimal otherFee;

    @Column(name = "total", precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "status")
    private String status; // 'UNPAID', 'PAID',...

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "electricity_water_id")
    private ElectricityWater electricityWater;
}