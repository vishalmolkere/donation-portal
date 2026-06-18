package com.donation.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class FundRequestCreateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 20, message = "Please describe your need in at least 20 characters")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull @DecimalMin(value = "100.0", message = "Minimum amount is 100")
    private BigDecimal amountNeeded;

    /** Receiver self-declares emergency — skips admin review queue */
    private boolean emergency = false;

    /** Required when emergency = true — must explain what the emergency is */
    @Size(max = 500, message = "Emergency reason must be under 500 characters")
    private String emergencyReason;
}
