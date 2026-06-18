package com.donation.service;

import com.donation.dto.*;
import com.donation.entity.Role;
import com.donation.entity.User;
import com.donation.exception.ResourceAlreadyExistsException;
import com.donation.repository.UserRepository;
import com.donation.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final NotificationService notificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new ResourceAlreadyExistsException("Email already registered: " + request.getEmail());

        Role role = "RECEIVER".equalsIgnoreCase(request.getRole()) ? Role.ROLE_RECEIVER : Role.ROLE_DONOR;

        User user = User.builder()
                .name(request.getName()).email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role).phone(request.getPhone()).address(request.getAddress())
                .description(request.getDescription()).isVerified(false).build();
        userRepository.save(user);

        String welcomeMsg = role == Role.ROLE_RECEIVER
            ? "Welcome " + user.getName() + "! Your account is pending admin verification."
            : "Welcome " + user.getName() + "! Browse open fund requests and start donating.";
        notificationService.createNotification(user, welcomeMsg, "WELCOME");

        UserDetails ud = userDetailsService.loadUserByUsername(user.getEmail());
        return buildAuthResponse(user, jwtService.generateToken(ud));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDetails ud = userDetailsService.loadUserByUsername(user.getEmail());
        return buildAuthResponse(user, jwtService.generateToken(ud));
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token).type("Bearer")
                .id(user.getId()).name(user.getName()).email(user.getEmail())
                .role(user.getRole().name())
                // FIX: include verification + emergency lock state in every auth response
                .isVerified(Boolean.TRUE.equals(user.getIsVerified()))
                .emergencyLocked(Boolean.TRUE.equals(user.getEmergencyLocked()))
                .build();
    }
}
