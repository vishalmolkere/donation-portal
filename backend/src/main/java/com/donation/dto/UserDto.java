package com.donation.dto;
import com.donation.entity.Role;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String phone;
    private String address;
    private String description;
    private Boolean isVerified;
    private Boolean emergencyLocked;
    private String emergencyLockReason;
    private LocalDateTime createdAt;
    private int totalDonations;
    private int totalFundRequests;
}
