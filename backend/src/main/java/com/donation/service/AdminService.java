package com.donation.service;

import com.donation.dto.DashboardDto;
import com.donation.dto.DonationDto;
import com.donation.entity.Role;
import com.donation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DonationRepository donationRepository;
    private final FundRequestRepository fundRequestRepository;
    private final DonationService donationService;

    @Transactional(readOnly = true)
    public DashboardDto getDashboard() {
        BigDecimal totalRaised = donationRepository.getTotalDonated();

        // Single GROUP BY query — replaces 3 separate findByRole() calls
        long totalDonors = 0, totalReceivers = 0, totalAdmins = 0;
        for (Object[] row : userRepository.countByRoleGrouped()) {
            Role role = (Role) row[0];
            long count = (Long) row[1];
            if (role == Role.ROLE_DONOR)
                totalDonors = count;
            if (role == Role.ROLE_RECEIVER)
                totalReceivers = count;
            if (role == Role.ROLE_ADMIN)
                totalAdmins = count;
        }

        // BUG 1 FIX: fetch only 10 recent donations for overview summary
        // avoids N+1 from calling getAllDonations() which fires paymentRepo per row
        List<DonationDto> recentDonations = donationService.getRecentDonations(10);

        return DashboardDto.builder()
                .totalUsers(userRepository.count())
                .totalDonors(totalDonors)
                .totalReceivers(totalReceivers)
                .totalAdmins(totalAdmins)
                .totalDonations(donationRepository.countCompleted())
                .totalAmountRaised(totalRaised != null ? totalRaised : BigDecimal.ZERO)
                .pendingRequests(fundRequestRepository.countByStatus("PENDING"))
                .approvedRequests(fundRequestRepository.countByStatus("APPROVED"))
                .fulfilledRequests(fundRequestRepository.countByStatus("FULFILLED"))
                .rejectedRequests(fundRequestRepository.countByStatus("REJECTED"))
                .recentDonations(recentDonations)
                .build();
    }
}
