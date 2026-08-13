package com.motel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(
        name = "rooms",
        uniqueConstraints = {
                // Ràng buộc duy nhất kết hợp giữa motel_id và room_code
                @UniqueConstraint(name = "UK_motel_room_code", columnNames = {"motel_id", "room_code"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", length = 20, nullable = false)
    private String roomCode;

    @Column(name = "area", precision = 10, scale = 2)
    private BigDecimal area;

    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "max_people")
    private Integer maxPeople;

    @Column(name = "status")
    private String status; // 'EMPTY', 'RENTED', 'MAINTENANCE',...

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motel_id")
    private Motel motel;
}