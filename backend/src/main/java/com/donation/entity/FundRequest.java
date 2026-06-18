package com.donation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "fund_requests")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FundRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(name = "amount_needed", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountNeeded;

    @Column(name = "amount_received", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal amountReceived = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "admin_note")
    private String adminNote;

    // ── Emergency fields ────────────────────────────────────────────────────
    /** True when receiver self-declares this as an emergency at submission time.
     *  Emergency requests skip admin approval and go live immediately (APPROVED). */
    @Column(name = "is_emergency", nullable = false)
    @Builder.Default
    private Boolean isEmergency = false;

    /** Brief reason the receiver provides when marking as emergency.
     *  Shown on the request card so donors understand urgency. */
    @Column(name = "emergency_reason", length = 500)
    private String emergencyReason;

    /** Timestamp when emergency was declared (= createdAt for self-declared emergencies). */
    @Column(name = "emergency_declared_at")
    private LocalDateTime emergencyDeclaredAt;

    /** Admin can flag a suspicious emergency request for review even after it went live. */
    @Column(name = "is_flagged", nullable = false)
    @Builder.Default
    private Boolean isFlagged = false;

    @Column(name = "flag_reason")
    private String flagReason;
    // ────────────────────────────────────────────────────────────────────────

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @OneToMany(mappedBy = "fundRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Donation> donations;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
