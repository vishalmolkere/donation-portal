package com.donation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "receipts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Receipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "receipt_number", unique = true, nullable = false)
    private String receiptNumber;
    @Column(name = "issued_at")
    private LocalDateTime issuedAt;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;
    @PrePersist protected void onCreate() { issuedAt = LocalDateTime.now(); }
}
