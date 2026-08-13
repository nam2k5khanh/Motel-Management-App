package com.motel.backend.repository;

import com.motel.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // Lấy lịch sử tất cả các lượt thanh toán của một Hóa đơn
    List<Payment> findByInvoiceId(Long invoiceId);
}