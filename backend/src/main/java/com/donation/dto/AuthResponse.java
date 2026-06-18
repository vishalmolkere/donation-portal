package com.donation.dto;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type;
    private Long id;
    private String name;
    private String email;
    private String role;
    // FIX: include these so frontend never needs a separate /me call
    private Boolean isVerified;
    private Boolean emergencyLocked;
}
