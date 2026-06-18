package com.donation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FlagRequest {
    @NotBlank(message = "Reason for flagging is required")
    private String reason;
}
