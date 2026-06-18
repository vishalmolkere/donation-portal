package com.donation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "txn_id", unique = true)
    private String txnId;
    @Column(nullable = false)
    private String method;
    @Column(nullable = false) @Builder.Default
    private String status = "SUCCESS";
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;
    @OneToOne(mappedBy = "payment", cascade = CascadeType.ALL)
    private Receipt receipt;
    @PrePersist protected void onCreate() { paidAt = LocalDateTime.now(); }
}
