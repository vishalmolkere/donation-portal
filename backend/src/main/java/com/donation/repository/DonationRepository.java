package com.donation.repository;

import com.donation.entity.Donation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {

    List<Donation> findByDonorId(Long donorId);
    List<Donation> findByFundRequestId(Long fundRequestId);
    long countByDonorId(Long donorId);
    long countByFundRequestId(Long fundRequestId);

    @Query("SELECT SUM(d.amount) FROM Donation d WHERE d.status = 'COMPLETED'")
    BigDecimal getTotalDonated();

    @Query("SELECT COUNT(d) FROM Donation d WHERE d.status = 'COMPLETED'")
    Long countCompleted();

    // Batch count: all donors at once — prevents N+1 in UserService.getAllUsers()
    @Query("SELECT d.donor.id, COUNT(d) FROM Donation d GROUP BY d.donor.id")
    List<Object[]> countDonationsByAllDonors();

    // JOIN FETCH payment to avoid N+1 in list methods — Donation has @OneToOne Payment
    @Query("SELECT d FROM Donation d LEFT JOIN FETCH d.payment WHERE d.donor.id = :donorId ORDER BY d.donatedAt DESC")
    List<Donation> findByDonorIdWithPayment(@Param("donorId") Long donorId);

    @Query("SELECT d FROM Donation d LEFT JOIN FETCH d.payment WHERE d.fundRequest.receiver.id = :receiverId ORDER BY d.donatedAt DESC")
    List<Donation> findByReceiverIdWithPayment(@Param("receiverId") Long receiverId);

    @Query("SELECT d FROM Donation d LEFT JOIN FETCH d.payment ORDER BY d.donatedAt DESC")
    List<Donation> findAllWithPayment();

    // Paginated for admin overview — keeps dashboard fast
    @Query("SELECT d FROM Donation d LEFT JOIN FETCH d.payment ORDER BY d.donatedAt DESC")
    List<Donation> findRecentWithPayment(Pageable pageable);
}
