package com.motel.backend.repository;

import com.motel.backend.entity.ElectricityWater;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ElectricityWaterRepository extends JpaRepository<ElectricityWater, Long> {

    // Tìm danh sách theo tháng và năm
    List<ElectricityWater> findByMonthAndYear(Integer month, Integer year);

    // Kiểm tra xem phòng đó trong tháng/năm đó đã được ghi nhận chỉ số chưa
    Optional<ElectricityWater> findByRoomIdAndMonthAndYear(Long roomId, Integer month, Integer year);
}