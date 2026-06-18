package com.donation.service;

import com.donation.dto.FundRequestCreateRequest;
import com.donation.dto.FundRequestDto;
import com.donation.dto.FundRequestReviewRequest;
import com.donation.entity.FundRequest;
import com.donation.entity.Role;
import com.donation.entity.User;
import com.donation.exception.BadRequestException;
import com.donation.exception.ResourceNotFoundException;
import com.donation.repository.DonationRepository;
import com.donation.repository.FundRequestRepository;
import com.donation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FundRequestService {

    private static final int MAX_ACTIVE_EMERGENCIES = 2;
    private static final int ABUSE_THRESHOLD_30D    = 3;

    private final FundRequestRepository fundRequestRepository;
    private final UserRepository        userRepository;
    private final DonationRepository    donationRepository;
    private final NotificationService   notificationService;

    @Transactional
    public FundRequestDto createFundRequest(FundRequestCreateRequest request) {
        User receiver = getRequiredUser();
        if (receiver.getRole() != Role.ROLE_RECEIVER)
            throw new AccessDeniedException("Only receivers can create fund requests");
        if (!Boolean.TRUE.equals(receiver.getIsVerified()))
            throw new BadRequestException("Your account must be verified by an admin before submitting fund requests.");

        boolean isEmergency = request.isEmergency();
        LocalDateTime emergencyDeclaredAt = null;

        if (isEmergency) {
            if (request.getEmergencyReason() == null || request.getEmergencyReason().isBlank())
                throw new BadRequestException("Please describe why this is an emergency.");
            if (Boolean.TRUE.equals(receiver.getEmergencyLocked()))
                throw new BadRequestException("Your emergency access has been restricted. Reason: "
                    + (receiver.getEmergencyLockReason() != null ? receiver.getEmergencyLockReason() : "Contact admin."));

            long active = fundRequestRepository.countActiveEmergenciesByReceiver(receiver.getId());
            if (active >= MAX_ACTIVE_EMERGENCIES)
                throw new BadRequestException("You already have " + active
                    + " active emergency request(s). Wait for them to be fulfilled first.");

            long count30d = fundRequestRepository.countEmergenciesSince(receiver.getId(), LocalDateTime.now().minusDays(30));
            if (count30d >= ABUSE_THRESHOLD_30D) {
                receiver.setEmergencyLocked(true);
                receiver.setEmergencyLockReason("Auto-locked: " + count30d + " emergencies in 30 days.");
                userRepository.save(receiver);
                throw new BadRequestException("Emergency access restricted due to high frequency. Contact admin.");
            }
            emergencyDeclaredAt = LocalDateTime.now();
        }

        FundRequest fr = FundRequest.builder()
                .title(request.getTitle()).description(request.getDescription())
                .category(request.getCategory()).amountNeeded(request.getAmountNeeded())
                .status(isEmergency ? "APPROVED" : "PENDING")
                .approvedAt(isEmergency ? LocalDateTime.now() : null)
                .isEmergency(isEmergency).emergencyReason(request.getEmergencyReason())
                .emergencyDeclaredAt(emergencyDeclaredAt).isFlagged(false)
                .receiver(receiver).build();

        FundRequest saved = fundRequestRepository.save(fr);

        if (isEmergency) {
            notificationService.createNotification(receiver,
                "🚨 Your emergency request \"" + fr.getTitle() + "\" is now LIVE.", "EMERGENCY_AUTO_APPROVED");
            userRepository.findByRole(Role.ROLE_ADMIN).forEach(admin ->
                notificationService.createNotification(admin,
                    "🚨 Emergency: \"" + fr.getTitle() + "\" by " + receiver.getName() + " is live. Please review.",
                    "EMERGENCY_ADMIN_ALERT"));
        } else {
            notificationService.createNotification(receiver,
                "Your request \"" + fr.getTitle() + "\" is pending admin review.", "FUND_REQUEST_SUBMITTED");
        }
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<FundRequestDto> getApprovedRequests() {
        return mapToDtoList(fundRequestRepository.findAllApproved());
    }

    @Transactional(readOnly = true)
    public List<FundRequestDto> getMyRequests() {
        return mapToDtoList(fundRequestRepository.findByReceiverId(getRequiredUser().getId()));
    }

    @Transactional(readOnly = true)
    public FundRequestDto getById(Long id) {
        FundRequest fr = findById(id);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
        if (authenticated) {
            User current = userRepository.findByEmail(auth.getName()).orElse(null);
            if (current != null) {
                if (current.getRole() == Role.ROLE_ADMIN) return mapToDto(fr);
                if (current.getRole() == Role.ROLE_RECEIVER && fr.getReceiver().getId().equals(current.getId()))
                    return mapToDto(fr);
            }
        }
        if ("APPROVED".equals(fr.getStatus()) || "FULFILLED".equals(fr.getStatus())) return mapToDto(fr);
        throw new ResourceNotFoundException("Fund request not found or not yet approved");
    }

    @Transactional
    public FundRequestDto reviewRequest(Long id, FundRequestReviewRequest review) {
        FundRequest fr = findById(id);
        boolean isEmergency = Boolean.TRUE.equals(fr.getIsEmergency());

        // Only block truly terminal states — admin can approve pending OR revoke any approved request
        if ("REJECTED".equals(fr.getStatus()))
            throw new BadRequestException("This request has already been rejected.");
        if ("FULFILLED".equals(fr.getStatus()))
            throw new BadRequestException("This request has already been fulfilled and cannot be changed.");

        String decision = review.getDecision().toUpperCase();
        if (!decision.equals("APPROVED") && !decision.equals("REJECTED"))
            throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");

        // FIX: enforce a real reason on rejection at the backend, not just client-side alert()
        if (decision.equals("REJECTED")
                && (review.getAdminNote() == null || review.getAdminNote().isBlank()))
            throw new BadRequestException("A note explaining the rejection is required.");

        fr.setStatus(decision);
        fr.setAdminNote(review.getAdminNote());
        if ("APPROVED".equals(decision) && fr.getApprovedAt() == null) fr.setApprovedAt(LocalDateTime.now());

        FundRequestDto dto = mapToDto(fundRequestRepository.save(fr));

        String msg = "APPROVED".equals(decision)
            ? "Your request \"" + fr.getTitle() + "\" has been APPROVED and is live!"
            : (isEmergency
                ? "⚠️ Your emergency request \"" + fr.getTitle() + "\" was revoked. Reason: "
                : "Your request \"" + fr.getTitle() + "\" was not approved. Reason: ")
              + review.getAdminNote();
        notificationService.createNotification(fr.getReceiver(), msg, "FUND_REQUEST_" + decision);
        return dto;
    }

    @Transactional
    public FundRequestDto flagRequest(Long id, String reason) {
        FundRequest fr = findById(id);
        // FIX: never persist a null/blank reason — default it at the backend so flagReason is always meaningful
        String safeReason = (reason == null || reason.isBlank()) ? "Flagged by admin for review" : reason;
        fr.setIsFlagged(true);
        fr.setFlagReason(safeReason);
        FundRequestDto dto = mapToDto(fundRequestRepository.save(fr));
        notificationService.createNotification(fr.getReceiver(),
            "⚠️ Your request \"" + fr.getTitle() + "\" is being reviewed by admin.", "REQUEST_FLAGGED");
        return dto;
    }

    @Transactional
    public void lockEmergencyAccess(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setEmergencyLocked(true);
        user.setEmergencyLockReason(reason != null ? reason : "Locked by admin");
        userRepository.save(user);
        notificationService.createNotification(user,
            "⚠️ Your emergency access has been restricted. Contact support.", "EMERGENCY_ACCESS_LOCKED");
    }

    @Transactional
    public void unlockEmergencyAccess(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setEmergencyLocked(false);
        user.setEmergencyLockReason(null);
        userRepository.save(user);
        notificationService.createNotification(user,
            "✅ Your emergency access has been restored.", "EMERGENCY_ACCESS_UNLOCKED");
    }

    @Transactional(readOnly = true)
    public List<FundRequestDto> getAllByStatus(String status) {
        if (status == null || status.isBlank())
            return mapToDtoList(fundRequestRepository.findAll());
        if ("FLAGGED".equalsIgnoreCase(status))
            return mapToDtoList(fundRequestRepository.findAllFlagged());
        if ("EMERGENCY".equalsIgnoreCase(status))
            return mapToDtoList(fundRequestRepository.findActiveEmergencies());
        if ("EMERGENCY_ALL".equalsIgnoreCase(status))
            return mapToDtoList(fundRequestRepository.findAllEmergency());
        return mapToDtoList(fundRequestRepository.findByStatus(status.toUpperCase()));
    }

    @Transactional
    public void deleteFundRequest(Long id) {
        FundRequest fr = findById(id);
        User current = getRequiredUser();
        if (current.getRole() == Role.ROLE_RECEIVER) {
            if (!fr.getReceiver().getId().equals(current.getId()))
                throw new AccessDeniedException("Not your request");
            // Receivers may only delete PENDING requests — not APPROVED or FULFILLED
            if (!"PENDING".equals(fr.getStatus()) && !"REJECTED".equals(fr.getStatus()))
                throw new BadRequestException(
                    "You can only delete PENDING or REJECTED requests. Contact admin to remove approved requests.");
        }
        fundRequestRepository.deleteById(id);
    }

    private FundRequest findById(Long id) {
        return fundRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fund request not found: " + id));
    }

    private User getRequiredUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new AccessDeniedException("Authentication required");
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }


    /** Batch-maps a list of FundRequests — avoids N+1 from countByFundRequestId per row */
    private List<FundRequestDto> mapToDtoList(List<FundRequest> list) {
        if (list.isEmpty()) return Collections.emptyList();
        List<Long> ids = list.stream().map(FundRequest::getId).collect(Collectors.toList());
        // Single query: donation count for all request ids
        Map<Long, Long> countMap = new HashMap<>();
        fundRequestRepository.countDonationsByFundRequestIds(ids)
            .forEach(row -> countMap.put((Long) row[0], (Long) row[1]));

        BigDecimal zero = BigDecimal.ZERO;
        return list.stream().map(fr -> {
            BigDecimal needed = fr.getAmountNeeded(), received = fr.getAmountReceived();
            double progress = needed.doubleValue() > 0
                    ? (received.doubleValue() / needed.doubleValue()) * 100 : 0;
            long dCount = countMap.getOrDefault(fr.getId(), 0L);
            return FundRequestDto.builder()
                    .id(fr.getId()).title(fr.getTitle()).description(fr.getDescription())
                    .category(fr.getCategory()).amountNeeded(needed).amountReceived(received)
                    .amountRemaining(needed.subtract(received).max(zero))
                    .status(fr.getStatus()).adminNote(fr.getAdminNote())
                    .createdAt(fr.getCreatedAt()).approvedAt(fr.getApprovedAt())
                    .receiverId(fr.getReceiver().getId()).receiverName(fr.getReceiver().getName())
                    .receiverEmail(fr.getReceiver().getEmail())
                    .donationCount((int) dCount)
                    .progressPercent(Math.min(progress, 100))
                    .isEmergency(fr.getIsEmergency()).emergencyReason(fr.getEmergencyReason())
                    .emergencyDeclaredAt(fr.getEmergencyDeclaredAt())
                    .isFlagged(fr.getIsFlagged()).flagReason(fr.getFlagReason())
                    .build();
        }).collect(Collectors.toList());
    }

    public FundRequestDto mapToDto(FundRequest fr) {
        BigDecimal needed = fr.getAmountNeeded(), received = fr.getAmountReceived();
        double progress = needed.doubleValue() > 0 ? (received.doubleValue() / needed.doubleValue()) * 100 : 0;
        return FundRequestDto.builder()
                .id(fr.getId()).title(fr.getTitle()).description(fr.getDescription())
                .category(fr.getCategory()).amountNeeded(needed).amountReceived(received)
                .amountRemaining(needed.subtract(received).max(BigDecimal.ZERO))
                .status(fr.getStatus()).adminNote(fr.getAdminNote())
                .createdAt(fr.getCreatedAt()).approvedAt(fr.getApprovedAt())
                .receiverId(fr.getReceiver().getId()).receiverName(fr.getReceiver().getName())
                .receiverEmail(fr.getReceiver().getEmail())
                .donationCount((int) donationRepository.countByFundRequestId(fr.getId()))
                .progressPercent(Math.min(progress, 100))
                .isEmergency(fr.getIsEmergency()).emergencyReason(fr.getEmergencyReason())
                .emergencyDeclaredAt(fr.getEmergencyDeclaredAt())
                .isFlagged(fr.getIsFlagged()).flagReason(fr.getFlagReason())
                .build();
    }
}
