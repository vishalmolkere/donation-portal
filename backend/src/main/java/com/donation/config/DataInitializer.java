package com.donation.config;

import com.donation.entity.Role;
import com.donation.entity.User;
import com.donation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default admin account on first startup ONLY if no admin exists yet.
 *
 * Credentials are read from environment variables:
 *   ADMIN_SEED_EMAIL    (default: admin@donation.com)
 *   ADMIN_SEED_PASSWORD (default: Admin@123  — MUST be changed in production)
 *
 * Credentials are NEVER printed to logs.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_SEED_EMAIL:admin@donation.com}")
    private String adminEmail;

    @Value("${ADMIN_SEED_PASSWORD:Admin@123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        boolean adminExists = userRepository.findByRole(Role.ROLE_ADMIN)
                .stream().findAny().isPresent();

        if (!adminExists) {
            if ("Admin@123".equals(adminPassword)) {
                log.warn("========================================================");
                log.warn("  WARNING: Using default admin password.");
                log.warn("  Set ADMIN_SEED_PASSWORD env var before production!");
                log.warn("========================================================");
            }

            User admin = User.builder()
                    .name("Super Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ROLE_ADMIN)
                    .isVerified(true)
                    .phone("0000000000")
                    .address("System")
                    .description("Default system administrator")
                    .build();

            userRepository.save(admin);
            // Log that admin was created but NOT the credentials
            log.info("Default admin account created for email: {}", adminEmail);
            log.info("Please change the admin password via the Admin Panel immediately.");
        } else {
            log.info("Admin account already exists — skipping seed.");
        }
    }
}
