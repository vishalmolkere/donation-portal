package com.donation.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FundRequestDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private BigDecimal amountNeeded;
    private BigDecimal amountReceived;
    private BigDecimal amountRemaining;
    private String status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private Long receiverId;
    private String receiverName;
    private String receiverEmail;
    private int donationCount;
    private double progressPercent;

    // ── Emergency fields ────────────────────────────────────────────────────
    private Boolean isEmergency;
    private String emergencyReason;
    private LocalDateTime emergencyDeclaredAt;
    private Boolean isFlagged;
    private String flagReason;
    // ────────────────────────────────────────────────────────────────────────
}
