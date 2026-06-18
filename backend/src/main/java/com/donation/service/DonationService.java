package com.donation.service;

import com.donation.dto.DonationDto;
import com.donation.dto.DonationRequest;
import com.donation.entity.*;
import com.donation.exception.BadRequestException;
import com.donation.exception.ResourceNotFoundException;
import com.donation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final FundRequestRepository fundRequestRepository;
    private final PaymentRepository paymentRepository;
    private final ReceiptRepository receiptRepository;
    private final NotificationService notificationService;

    @Transactional
    public DonationDto donate(DonationRequest request) {
        User donor = getCurrentUser();
        if (donor.getRole() != Role.ROLE_DONOR)
            throw new AccessDeniedException("Only donors can make donations");

        // FIX: use pessimistic write lock to prevent race condition
        FundRequest fr = fundRequestRepository.findByIdForUpdate(request.getFundRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Fund request not found"));

        // Validate status
        if ("FULFILLED".equals(fr.getStatus()))
            throw new BadRequestException("This request has already been fully funded. No more donations needed!");
        if ("PENDING".equals(fr.getStatus()))
            throw new BadRequestException("This request is still under review. Please check back after admin approval.");
        if (!"APPROVED".equals(fr.getStatus()))
            throw new BadRequestException("This fund request is not accepting donations.");

        // Calculate remaining with locked data — safe from race condition
        BigDecimal remaining = fr.getAmountNeeded().subtract(fr.getAmountReceived());
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            fr.setStatus("FULFILLED");
            fundRequestRepository.save(fr);
            throw new BadRequestException("This request is already fully funded!");
        }

        // Cap donation to remaining amount
        BigDecimal donationAmount = request.getAmount();
        if (donationAmount.compareTo(remaining) > 0) {
            donationAmount = remaining;
        }

        Donation donation = Donation.builder()
                .amount(donationAmount)
                .message(request.getMessage())
                .status("PENDING")
                .donor(donor)
                .fundRequest(fr)
                .build();
        donation = donationRepository.save(donation);

        // Process payment (simulated — integrate real gateway in production)
        String txnId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Payment payment = Payment.builder()
                .txnId(txnId)
                .method(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CARD")
                .status("SUCCESS")
                .donation(donation)
                .build();
        paymentRepository.save(payment);

        donation.setStatus("COMPLETED");
        donationRepository.save(donation);

        // Update fund request totals
        BigDecimal newTotal = fr.getAmountReceived().add(donationAmount);
        fr.setAmountReceived(newTotal);
        boolean justFulfilled = newTotal.compareTo(fr.getAmountNeeded()) >= 0;
        if (justFulfilled) {
            fr.setStatus("FULFILLED");
        }
        fundRequestRepository.save(fr);

        // Receipt
        receiptRepository.save(Receipt.builder()
                .receiptNumber("RCP-" + System.currentTimeMillis())
                .payment(payment)
                .build());

        // FIX: wire notifications to business events
        // Notify receiver about donation received
        notificationService.createNotification(
            fr.getReceiver(),
            donor.getName() + " donated ₹" + donationAmount.toPlainString() + " to your request \"" + fr.getTitle() + "\"",
            "DONATION_RECEIVED"
        );

        // Notify receiver if goal is now fully met
        if (justFulfilled) {
            notificationService.createNotification(
                fr.getReceiver(),
                "🎉 Your fund request \"" + fr.getTitle() + "\" has been fully funded! Goal reached.",
                "GOAL_FULFILLED"
            );
            // Notify donor they completed the goal
            notificationService.createNotification(
                donor,
                "You completed the funding goal for \"" + fr.getTitle() + "\"! Thank you for your generosity.",
                "GOAL_COMPLETED_BY_DONOR"
            );
        }

        return mapToDto(donation, txnId);
    }

    @Transactional(readOnly = true)
    public List<DonationDto> getMyDonations() {
        User donor = getCurrentUser();
        return donationRepository.findByDonorIdWithPayment(donor.getId()).stream()
                .map(d -> mapToDto(d, d.getPayment() != null ? d.getPayment().getTxnId() : null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DonationDto> getDonationsForMyRequests() {
        User receiver = getCurrentUser();
        return donationRepository.findByReceiverIdWithPayment(receiver.getId())
                .stream().map(d -> mapToDto(d, d.getPayment() != null ? d.getPayment().getTxnId() : null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DonationDto> getAllDonations() {
        return donationRepository.findAllWithPayment().stream()
                .map(d -> mapToDto(d, d.getPayment() != null ? d.getPayment().getTxnId() : null))
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public List<DonationDto> getRecentDonations(int limit) {
        return donationRepository.findRecentWithPayment(
                org.springframework.data.domain.PageRequest.of(0, limit))
                .stream()
                .map(d -> mapToDto(d, d.getPayment() != null ? d.getPayment().getTxnId() : null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DonationDto getById(Long id) {
        Donation d = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found: " + id));
        User current = getCurrentUser();
        if (current.getRole() == Role.ROLE_DONOR && !d.getDonor().getId().equals(current.getId()))
            throw new AccessDeniedException("Access denied");
        if (current.getRole() == Role.ROLE_RECEIVER
                && !d.getFundRequest().getReceiver().getId().equals(current.getId()))
            throw new AccessDeniedException("Access denied");
        return mapToDto(d, getTxn(d));
    }

    @Transactional
    public void deleteDonation(Long id) {
        Donation donation = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found: " + id));

        // Only reverse amount if donation was COMPLETED (actually credited)
        if ("COMPLETED".equals(donation.getStatus())) {
            FundRequest fr = fundRequestRepository.findByIdForUpdate(donation.getFundRequest().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Fund request not found"));

            BigDecimal newTotal = fr.getAmountReceived().subtract(donation.getAmount());
            if (newTotal.compareTo(BigDecimal.ZERO) < 0) newTotal = BigDecimal.ZERO;
            fr.setAmountReceived(newTotal);

            // If request was FULFILLED but now total is below goal — reopen it
            if ("FULFILLED".equals(fr.getStatus()) && newTotal.compareTo(fr.getAmountNeeded()) < 0) {
                fr.setStatus("APPROVED");
            }
            fundRequestRepository.save(fr);
        }

        // Notify receiver that a donation was removed and their total changed
        notificationService.createNotification(
            donation.getFundRequest().getReceiver(),
            "An admin removed a donation of ₹" + donation.getAmount().toPlainString() +
            " from your request \"" + donation.getFundRequest().getTitle() + "\"",
            "DONATION_REMOVED"
        );

        donationRepository.deleteById(id);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String getTxn(Donation d) {
        return paymentRepository.findByDonationId(d.getId()).map(Payment::getTxnId).orElse(null);
    }

    public DonationDto mapToDto(Donation d, String txnId) {
        return DonationDto.builder()
                .id(d.getId()).amount(d.getAmount()).message(d.getMessage())
                .status(d.getStatus()).donatedAt(d.getDonatedAt())
                .donorId(d.getDonor().getId()).donorName(d.getDonor().getName())
                .fundRequestId(d.getFundRequest().getId())
                .fundRequestTitle(d.getFundRequest().getTitle())
                .receiverName(d.getFundRequest().getReceiver().getName())
                .txnId(txnId).build();
    }
}
