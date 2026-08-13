package com.motel.backend.service;

import com.motel.backend.dto.request.ContractRequest;
import com.motel.backend.entity.Contract;
import com.motel.backend.entity.Room;
import com.motel.backend.entity.User;
import com.motel.backend.repository.ContractRepository;
import com.motel.backend.repository.RoomRepository;
import com.motel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    public Contract getContractById(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng ID: " + id));
    }

    public Long findLandlordIdByContractId(Long contractId) {
        return contractRepository.findLandlordIdByContractId(contractId);
    }

    public List<Contract> getContractByTenantId(Long id) {
        return contractRepository.findByTenantId(id);
    }

    public Contract getContractByTenantIdAndStatus(Long id, String status) {
        return  contractRepository.findByTenantIdAndStatus(id, status);
    }

    public Contract getContractByRoomIdAndStatus(Long roomId, String status) {
        return contractRepository.findByRoomIdAndStatus(roomId, status);
    }

    // Lấy danh sách hợp đồng đang ACTIVE theo dãy trọ (Phục vụ lập hóa đơn)
    public List<Contract> getActiveContractsByMotelId(Long motelId) {
        return contractRepository.findByRoomMotelIdAndStatus(motelId, "ACTIVE");
    }

    public List<Room> getActiveRoomsByMotelId(Long motelId) {
        return contractRepository.findByRoomMotelIdAndStatus(motelId, "ACTIVE")
                .stream()
                .map(Contract::getRoom)
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional
    public Contract createContract(ContractRequest request) {
        User tenant = userRepository.findById(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin khách thuê"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin phòng trọ"));

        Contract contract = new Contract();
        contract.setTenant(tenant);
        contract.setRoom(room);
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setDeposit(request.getDepositAmount());
        contract.setRentPrice(request.getRentPrice());

        String status = request.getStatus() != null ? request.getStatus() : "ACTIVE";
        contract.setStatus(status);

        // 🟢 CẬP NHẬT TRẠNG THÁI PHÒNG KHI TẠO HỢP ĐỒNG
        if ("ACTIVE".equalsIgnoreCase(status)) {
            room.setStatus("RENTED");
            roomRepository.save(room);
        }

        return contractRepository.save(contract);
    }

    @Transactional
    public Contract updateContract(Long id, ContractRequest request) {
        Contract contract = getContractById(id);
        Room oldRoom = contract.getRoom(); // Lưu phòng cũ nếu có đổi phòng khác

        if (request.getTenantId() != null) {
            User tenant = userRepository.findById(request.getTenantId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy khách thuê"));
            contract.setTenant(tenant);
        }

        Room newRoom = oldRoom;
        if (request.getRoomId() != null && !request.getRoomId().equals(oldRoom.getId())) {
            newRoom = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));

            // Trả phòng cũ về trạng thái EMPTY
            oldRoom.setStatus("EMPTY");
            roomRepository.save(oldRoom);

            contract.setRoom(newRoom);
        }

        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setDeposit(request.getDepositAmount());
        contract.setRentPrice(request.getRentPrice());

        if (request.getStatus() != null) {
            contract.setStatus(request.getStatus());

            // 🟢 CẬP NHẬT TRẠNG THÁI PHÒNG THEO TRẠNG THÁI HỢP ĐỒNG MỚI
            if ("EXPIRED".equalsIgnoreCase(request.getStatus()) || "TERMINATED".equalsIgnoreCase(request.getStatus())) {
                newRoom.setStatus("EMPTY");
            } else if ("ACTIVE".equalsIgnoreCase(request.getStatus())) {
                newRoom.setStatus("RENTED");
            }
            roomRepository.save(newRoom);
        }

        return contractRepository.save(contract);
    }

    @Transactional
    public void deleteContract(Long id) {
        Contract contract = getContractById(id);

        // 🟢 TRẢ PHÒNG VỀ TRẠNG THÁI TRỐNG KHI XÓA HỢP ĐỒNG
        Room room = contract.getRoom();
        if (room != null) {
            room.setStatus("EMPTY");
            roomRepository.save(room);
        }

        contractRepository.delete(contract);
    }
}