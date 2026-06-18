package com.donation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String phone;
    private String address;
    private String description;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    // ── Emergency abuse prevention ──────────────────────────────────────────

    /** When true, receiver cannot self-declare new emergencies.
     *  Set automatically when abuse threshold is reached, or manually by admin. */
    @Column(name = "emergency_locked")
    @Builder.Default
    private Boolean emergencyLocked = false;

    /** Admin note when manually locking emergency access. */
    @Column(name = "emergency_lock_reason")
    private String emergencyLockReason;
    // ────────────────────────────────────────────────────────────────────────

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "donor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Donation> donationsMade;

    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FundRequest> fundRequests;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Notification> notifications;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
