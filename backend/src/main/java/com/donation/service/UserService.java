package com.donation.service;

import com.donation.dto.UserDto;
import com.donation.entity.Role;
import com.donation.entity.User;
import com.donation.exception.ResourceNotFoundException;
import com.donation.repository.DonationRepository;
import com.donation.repository.FundRequestRepository;
import com.donation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository        userRepository;
    private final DonationRepository    donationRepository;
    private final FundRequestRepository fundRequestRepository;
    private final NotificationService   notificationService;

    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return mapToDto(userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        List<User> users = userRepository.findAll();

        // Batch counts — 2 queries for all users instead of 2 queries per user (N+1)
        Map<Long, Long> donationCounts = new HashMap<>();
        donationRepository.countDonationsByAllDonors()
                .forEach(row -> donationCounts.put((Long) row[0], (Long) row[1]));

        Map<Long, Long> requestCounts = new HashMap<>();
        fundRequestRepository.countRequestsByAllReceivers()
                .forEach(row -> requestCounts.put((Long) row[0], (Long) row[1]));

        return users.stream().map(u -> buildUserDto(u,
                donationCounts.getOrDefault(u.getId(), 0L).intValue(),
                requestCounts.getOrDefault(u.getId(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(String role) {
        return userRepository.findByRole(Role.valueOf("ROLE_" + role.toUpperCase()))
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        return mapToDto(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id)));
    }

    @Transactional
    public UserDto updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        String normalised = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
        user.setRole(Role.valueOf(normalised));
        UserDto dto = mapToDto(userRepository.save(user));
        notificationService.createNotification(user,
                "Your account role has been updated to: " + normalised.replace("ROLE_", ""),
                "ROLE_CHANGED");
        return dto;
    }

    @Transactional
    public UserDto verifyUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setIsVerified(true);
        UserDto dto = mapToDto(userRepository.save(user));
        notificationService.createNotification(user,
                "Your account has been verified! You can now submit fund requests.",
                "ACCOUNT_VERIFIED");
        return dto;
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        userRepository.deleteById(id);
    }

    // Used by single-entity methods (getById, verifyUser, updateRole, etc.)
    public UserDto mapToDto(User u) {
        int donationCount = (int) donationRepository.countByDonorId(u.getId());
        int requestCount  = (int) fundRequestRepository.countByReceiverId(u.getId());
        return buildUserDto(u, donationCount, requestCount);
    }

    // Core builder — used by both mapToDto and the batch version in getAllUsers()
    private UserDto buildUserDto(User u, int donationCount, int requestCount) {
        return UserDto.builder()
                .id(u.getId()).name(u.getName()).email(u.getEmail()).role(u.getRole())
                .phone(u.getPhone()).address(u.getAddress()).description(u.getDescription())
                .isVerified(u.getIsVerified())
                .emergencyLocked(u.getEmergencyLocked())
                .emergencyLockReason(u.getEmergencyLockReason())
                .createdAt(u.getCreatedAt())
                .totalDonations(donationCount)
                .totalFundRequests(requestCount)
                .build();
    }
}
