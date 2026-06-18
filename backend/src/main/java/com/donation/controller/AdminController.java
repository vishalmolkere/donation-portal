package com.donation.controller;

import com.donation.dto.*;
import com.donation.service.AdminService;
import com.donation.service.FundRequestService;
import com.donation.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final FundRequestService fundRequestService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardDto>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok("Dashboard", adminService.getDashboard()));
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok("All users", userService.getAllUsers()));
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(ApiResponse.ok("Users by role", userService.getUsersByRole(role)));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("User", userService.getUserById(id)));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserDto>> updateRole(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Role updated",
                userService.updateUserRole(id, body.get("role"))));
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<ApiResponse<UserDto>> verifyUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("User verified", userService.verifyUser(id)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted"));
    }

    // ── Emergency management ──────────────────────────────────────────────────

    /**
     * GET /api/admin/fund-requests?status=EMERGENCY
     * Lists all emergency requests (auto-approved, live).
     * Admin should review these after the fact.
     */
    @GetMapping("/fund-requests")
    public ResponseEntity<ApiResponse<List<FundRequestDto>>> getFundRequests(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok("Fund requests",
                fundRequestService.getAllByStatus(status)));
    }

    /**
     * PUT /api/admin/fund-requests/{id}/review
     * Approve or REJECT a pending request.
     * For emergency requests already live: REJECT = revoke and take offline.
     */
    @PutMapping("/fund-requests/{id}/review")
    public ResponseEntity<ApiResponse<FundRequestDto>> reviewRequest(
            @PathVariable Long id, @RequestBody FundRequestReviewRequest review) {
        return ResponseEntity.ok(ApiResponse.ok("Request reviewed",
                fundRequestService.reviewRequest(id, review)));
    }

    /**
     * PUT /api/admin/fund-requests/{id}/flag
     * Flag a suspicious emergency request for review without taking it offline.
     * Body: { "reason": "..." }
     */
    @PutMapping("/fund-requests/{id}/flag")
    public ResponseEntity<ApiResponse<FundRequestDto>> flagRequest(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Request flagged",
                fundRequestService.flagRequest(id, body.get("reason"))));
    }

    /**
     * PUT /api/admin/users/{id}/emergency-lock
     * Lock emergency access for a receiver abusing the feature.
     * Body: { "reason": "..." }
     */
    @PutMapping("/users/{id}/emergency-lock")
    public ResponseEntity<ApiResponse<Void>> lockEmergency(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        fundRequestService.lockEmergencyAccess(id, body.get("reason"));
        return ResponseEntity.ok(ApiResponse.ok("Emergency access locked"));
    }

    /**
     * PUT /api/admin/users/{id}/emergency-unlock
     * Restore emergency access after review.
     */
    @PutMapping("/users/{id}/emergency-unlock")
    public ResponseEntity<ApiResponse<Void>> unlockEmergency(@PathVariable Long id) {
        fundRequestService.unlockEmergencyAccess(id);
        return ResponseEntity.ok(ApiResponse.ok("Emergency access restored"));
    }
}
