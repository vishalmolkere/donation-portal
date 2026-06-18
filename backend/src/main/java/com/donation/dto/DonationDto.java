package com.donation.dto;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DonationDto {
    private Long id;
    private BigDecimal amount;
    private String message;
    private String status;
    private LocalDateTime donatedAt;
    private Long donorId;
    private String donorName;
    private Long fundRequestId;
    private String fundRequestTitle;
    private String receiverName;
    private String txnId;
}
