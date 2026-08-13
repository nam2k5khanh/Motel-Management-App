package com.motel.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.motel.backend.util.CodeGenerator;

@Entity
@Table(name = "motels")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Motel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "address")
    private String address;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "invite_code", unique = true, length = 10, updatable = false)
    private String inviteCode; // Mã mời của dãy trọ (VD: MT8021)

    @PrePersist
    public void generateCodeBeforeInsert() {
        if (this.inviteCode == null || this.inviteCode.trim().isEmpty()) {
            this.inviteCode = "MT" + CodeGenerator.generateInviteCode(4);
        }
    }
}