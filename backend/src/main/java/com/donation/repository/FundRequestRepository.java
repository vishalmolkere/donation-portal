package com.donation.repository;

import com.donation.entity.FundRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FundRequestRepository extends JpaRepository<FundRequest, Long> {

    List<FundRequest> findByReceiverId(Long receiverId);
    List<FundRequest> findByStatus(String status);
    long countByReceiverId(Long receiverId);

    // Public browse: APPROVED only, emergencies first
    @Query("SELECT f FROM FundRequest f WHERE f.status = 'APPROVED' ORDER BY f.isEmergency DESC, f.createdAt DESC")
    List<FundRequest> findAllApproved();

    // Admin: active (APPROVED, not yet fulfilled) emergencies only
    @Query("SELECT f FROM FundRequest f WHERE f.isEmergency = true AND f.status = 'APPROVED' ORDER BY f.createdAt DESC")
    List<FundRequest> findActiveEmergencies();

    // Admin: all emergencies ever (history)
    @Query("SELECT f FROM FundRequest f WHERE f.isEmergency = true ORDER BY f.createdAt DESC")
    List<FundRequest> findAllEmergency();

    // Admin: flagged requests
    @Query("SELECT f FROM FundRequest f WHERE f.isFlagged = true ORDER BY f.createdAt DESC")
    List<FundRequest> findAllFlagged();

    // Emergency abuse rules
    @Query("SELECT COUNT(f) FROM FundRequest f WHERE f.receiver.id = :receiverId AND f.isEmergency = true AND f.status = 'APPROVED'")
    long countActiveEmergenciesByReceiver(@Param("receiverId") Long receiverId);

    @Query("SELECT COUNT(f) FROM FundRequest f WHERE f.receiver.id = :receiverId AND f.isEmergency = true AND f.createdAt >= :since")
    long countEmergenciesSince(@Param("receiverId") Long receiverId, @Param("since") LocalDateTime since);

    // Dashboard counts — one query per status instead of loading full objects
    @Query("SELECT COUNT(f) FROM FundRequest f WHERE f.status = :status")
    long countByStatus(@Param("status") String status);

    // Batch count for all receivers — prevents N+1 in UserService.getAllUsers()
    @Query("SELECT f.receiver.id, COUNT(f) FROM FundRequest f GROUP BY f.receiver.id")
    List<Object[]> countRequestsByAllReceivers();

    // Batch donation count for a list of request IDs — prevents N+1 in mapToDtoList()
    @Query("SELECT f.id, COUNT(d) FROM FundRequest f LEFT JOIN f.donations d WHERE f.id IN :ids GROUP BY f.id")
    List<Object[]> countDonationsByFundRequestIds(@Param("ids") List<Long> ids);

    // Pessimistic write lock for donate() race condition prevention
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FundRequest f WHERE f.id = :id")
    Optional<FundRequest> findByIdForUpdate(@Param("id") Long id);
}
