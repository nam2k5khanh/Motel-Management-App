package com.motel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "electricity_water")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ElectricityWater {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "month")
    private Integer month;

    @Column(name = "year")
    private Integer year;

    @Column(name = "old_electric")
    private Integer oldElectric;

    @Column(name = "new_electric")
    private Integer newElectric;

    @Column(name = "electric_price", precision = 12, scale = 2)
    private BigDecimal electricPrice;

    @Column(name = "old_water")
    private Integer oldWater;

    @Column(name = "new_water")
    private Integer newWater;

    @Column(name = "water_price", precision = 12, scale = 2)
    private BigDecimal waterPrice;

    @Column(name = "total", precision = 12, scale = 2)
    private BigDecimal total;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;
}