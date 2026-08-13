package com.motel.backend.service;

import com.motel.backend.dto.DashboardDTO;
import com.motel.backend.repository.InvoiceRepository;
import com.motel.backend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class DashboardService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    public DashboardDTO getLandlordSummary(Long userId) {
        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();

        // 1. Tính doanh thu tháng hiện tại
        Double revenue = invoiceRepository.calculateMonthlyRevenue(currentMonth, currentYear, userId);
        double totalRevenue = (revenue != null) ? revenue : 0.0;

        // 2. Thống kê phòng
        long totalRooms;
        long rentedRooms;
        long emptyRooms;

        if (userId != null) {
            totalRooms = roomRepository.countTotalByUserId(userId);
            rentedRooms = roomRepository.countByStatusAndUserId("RENTED", userId);
            emptyRooms = roomRepository.countByStatusAndUserId("EMPTY", userId);
        } else {
            totalRooms = roomRepository.count();
            rentedRooms = roomRepository.countByStatus("RENTED");
            emptyRooms = roomRepository.countByStatus("EMPTY");
        }

        return new DashboardDTO(totalRevenue, rentedRooms, emptyRooms, totalRooms);
    }
}