package com.donation.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "notifications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String message;
    @Column(name = "is_read") @Builder.Default private boolean read = false;
    private String type;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
