package com.donation.dto;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String message;
    private boolean read;
    private String type;
    private LocalDateTime createdAt;
}
