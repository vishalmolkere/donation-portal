package com.donation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private String message;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "donated_at")
    private LocalDateTime donatedAt;

    // Who donated — field name: "donor"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    // Which request — field name: "fundRequest" (FundRequest.mappedBy references this)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_request_id", nullable = false)
    private FundRequest fundRequest;

    @OneToOne(mappedBy = "donation", cascade = CascadeType.ALL)
    private Payment payment;

    @PrePersist
    protected void onCreate() {
        donatedAt = LocalDateTime.now();
    }
}
