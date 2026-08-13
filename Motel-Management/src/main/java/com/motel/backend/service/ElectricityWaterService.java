package com.motel.backend.service;

import com.motel.backend.dto.ElectricityWaterDTO;
import com.motel.backend.entity.ElectricityWater;
import com.motel.backend.entity.Room;
import com.motel.backend.repository.ElectricityWaterRepository;
import com.motel.backend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ElectricityWaterService {

    @Autowired
    private ElectricityWaterRepository electricityWaterRepository;

    @Autowired
    private RoomRepository roomRepository;

    // 1. Lấy toàn bộ danh sách
    public List<ElectricityWater> getAll() {
        return electricityWaterRepository.findAll();
    }

    // 2. Lấy danh sách chỉ số theo Tháng & Năm
    public List<ElectricityWater> getByMonthAndYear(Integer month, Integer year) {
        return electricityWaterRepository.findByMonthAndYear(month, year);
    }

    // 3. Lấy theo ID
    public ElectricityWater getById(Long id) {
        return electricityWaterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi chỉ số điện nước có ID: " + id));
    }

    // 4. Thêm mới bản ghi chỉ số
    @Transactional
    public ElectricityWater create(ElectricityWaterDTO dto) {
        // Kiểm tra phòng tồn tại
        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng có ID: " + dto.getRoomId()));

        // Kiểm tra trung lặp (1 phòng chỉ nhập 1 lần / tháng)
        electricityWaterRepository.findByRoomIdAndMonthAndYear(dto.getRoomId(), dto.getMonth(), dto.getYear())
                .ifPresent(record -> {
                    throw new RuntimeException("Phòng này đã được nhập chỉ số cho Tháng " + dto.getMonth() + "/" + dto.getYear());
                });

        // Validate chỉ số mới >= cũ
        validateConsumption(dto.getOldElectric(), dto.getNewElectric(), dto.getOldWater(), dto.getNewWater());

        // Map dữ liệu & tính tổng tiền
        ElectricityWater record = new ElectricityWater();
        mapDtoToEntity(dto, record);
        record.setRoom(room);
        record.setTotal(calculateTotal(dto));

        return electricityWaterRepository.save(record);
    }

    // 5. Cập nhật chỉ số
    @Transactional
    public ElectricityWater update(Long id, ElectricityWaterDTO dto) {
        ElectricityWater record = getById(id);

        // Validate chỉ số
        validateConsumption(dto.getOldElectric(), dto.getNewElectric(), dto.getOldWater(), dto.getNewWater());

        // Nếu thay đổi phòng
        if (!record.getRoom().getId().equals(dto.getRoomId())) {
            Room newRoom = roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng có ID: " + dto.getRoomId()));
            record.setRoom(newRoom);
        }

        mapDtoToEntity(dto, record);
        record.setTotal(calculateTotal(dto));

        return electricityWaterRepository.save(record);
    }

    // 6. Xóa bản ghi
    @Transactional
    public void delete(Long id) {
        ElectricityWater record = getById(id);
        electricityWaterRepository.delete(record);
    }

    // --- CÁC HÀM BỔ TRỢ LOGIC (PRIVATE) ---

    private void validateConsumption(Integer oldElectric, Integer newElectric, Integer oldWater, Integer newWater) {
        if (newElectric != null && oldElectric != null && newElectric < oldElectric) {
            throw new IllegalArgumentException("Chỉ số điện mới không được nhỏ hơn chỉ số cũ!");
        }
        if (newWater != null && oldWater != null && newWater < oldWater) {
            throw new IllegalArgumentException("Chỉ số nước mới không được nhỏ hơn chỉ số cũ!");
        }
    }

    private BigDecimal calculateTotal(ElectricityWaterDTO dto) {
        long electricUsage = Math.max(0, dto.getNewElectric() - dto.getOldElectric());
        long waterUsage = Math.max(0, dto.getNewWater() - dto.getOldWater());

        BigDecimal electricCost = dto.getElectricPrice() != null
                ? dto.getElectricPrice().multiply(BigDecimal.valueOf(electricUsage))
                : BigDecimal.ZERO;

        BigDecimal waterCost = dto.getWaterPrice() != null
                ? dto.getWaterPrice().multiply(BigDecimal.valueOf(waterUsage))
                : BigDecimal.ZERO;

        return electricCost.add(waterCost);
    }

    private void mapDtoToEntity(ElectricityWaterDTO dto, ElectricityWater entity) {
        entity.setMonth(dto.getMonth());
        entity.setYear(dto.getYear());
        entity.setOldElectric(dto.getOldElectric());
        entity.setNewElectric(dto.getNewElectric());
        entity.setElectricPrice(dto.getElectricPrice());
        entity.setOldWater(dto.getOldWater());
        entity.setNewWater(dto.getNewWater());
        entity.setWaterPrice(dto.getWaterPrice());
    }
}