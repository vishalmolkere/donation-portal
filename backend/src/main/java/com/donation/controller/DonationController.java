package com.donation.controller;

import com.donation.dto.*;
import com.donation.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    /** DONOR donates to a fund request */
    @PostMapping
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<DonationDto>> donate(@Valid @RequestBody DonationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Donation successful! Thank you.", donationService.donate(req)));
    }

    /** DONOR — their own donation history */
    @GetMapping("/my")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<List<DonationDto>>> myDonations() {
        return ResponseEntity.ok(ApiResponse.ok("Your donations", donationService.getMyDonations()));
    }

    /** RECEIVER — see donations received for their requests */
    @GetMapping("/received")
    @PreAuthorize("hasRole('RECEIVER')")
    public ResponseEntity<ApiResponse<List<DonationDto>>> receivedDonations() {
        return ResponseEntity.ok(ApiResponse.ok("Donations received", donationService.getDonationsForMyRequests()));
    }

    /** ADMIN — all donations */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DonationDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("All donations", donationService.getAllDonations()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DonationDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Donation", donationService.getById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        donationService.deleteDonation(id);
        return ResponseEntity.ok(ApiResponse.ok("Donation deleted"));
    }
}
