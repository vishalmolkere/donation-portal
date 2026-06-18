package com.donation.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
@Data
public class DonationRequest {
    @NotNull @DecimalMin(value = "1.0", message = "Minimum donation is 1.00")
    private BigDecimal amount;
    private String message;
    @NotNull(message = "Fund Request ID is required")
    private Long fundRequestId;
    private String paymentMethod;
}
