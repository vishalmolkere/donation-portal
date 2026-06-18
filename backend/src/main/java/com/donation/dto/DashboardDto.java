package com.donation.dto;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardDto {
    private long totalUsers;
    private long totalDonors;
    private long totalReceivers;
    private long totalAdmins;
    private long totalDonations;
    private BigDecimal totalAmountRaised;
    private long pendingRequests;
    private long approvedRequests;
    private long fulfilledRequests;
    private long rejectedRequests;
    // recent donations shown in admin donations tab — kept for overview summary
    private List<DonationDto> recentDonations;
}
