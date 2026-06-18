package com.donation.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;
    @NotBlank @Email(message = "Invalid email")
    private String email;
    @NotBlank @Size(min = 6, message = "Password min 6 chars")
    private String password;
    // "DONOR" or "RECEIVER" — user chooses at signup
    @NotBlank(message = "Role is required (DONOR or RECEIVER)")
    private String role;
    // Optional fields for receivers
    private String phone;
    private String address;
    private String description;
}
