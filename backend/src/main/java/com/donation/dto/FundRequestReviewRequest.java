package com.donation.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class FundRequestReviewRequest {
    @NotBlank(message = "Decision required: APPROVED or REJECTED")
    private String decision; // APPROVED or REJECTED
    private String adminNote;
}
