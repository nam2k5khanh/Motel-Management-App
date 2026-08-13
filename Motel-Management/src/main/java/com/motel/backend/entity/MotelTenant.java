package com.motel.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "motel_tenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MotelTenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "motel_id", nullable = false)
    private Long motelId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; // PENDING, APPROVED, REJECTED, ACTIVE

    public enum Status {
        PENDING, APPROVED, REJECTED, ACTIVE, REMOVED
    }
}