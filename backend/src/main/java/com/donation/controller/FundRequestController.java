package com.donation.controller;

import com.donation.dto.*;
import com.donation.service.FundRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fund-requests")
@RequiredArgsConstructor
public class FundRequestController {

    private final FundRequestService fundRequestService;

    @PostMapping
    @PreAuthorize("hasRole('RECEIVER')")
    public ResponseEntity<ApiResponse<FundRequestDto>> create(@Valid @RequestBody FundRequestCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Fund request submitted", fundRequestService.createFundRequest(req)));
    }

    // PUBLIC: approved requests sorted by emergency first
    @GetMapping
    public ResponseEntity<ApiResponse<List<FundRequestDto>>> getApproved() {
        return ResponseEntity.ok(ApiResponse.ok("Approved requests", fundRequestService.getApprovedRequests()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RECEIVER')")
    public ResponseEntity<ApiResponse<List<FundRequestDto>>> getMine() {
        return ResponseEntity.ok(ApiResponse.ok("Your requests", fundRequestService.getMyRequests()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FundRequestDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Fund request", fundRequestService.getById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RECEIVER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        fundRequestService.deleteFundRequest(id);
        return ResponseEntity.ok(ApiResponse.ok("Deleted"));
    }
    // NOTE: /all and /{id}/review removed — admin uses /api/admin/fund-requests instead
}
