package com.motel.backend.service;

import com.motel.backend.dto.RepairRequestDTO;
import com.motel.backend.entity.RepairRequest;
import com.motel.backend.repository.RepairRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RepairRequestService {

    @Autowired
    private RepairRequestRepository repairRequestRepository;

    @Autowired
    private ContractService contractService;

    // Đổi sang SupabaseStorageService
    @Autowired
    private SupabaseStorageService supabaseStorageService;

    public List<RepairRequest> getAllRequests() {
        return repairRequestRepository.findAll();
    }

    public RepairRequest getById(Long id) {
        return repairRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu sửa chữa #" + id));
    }

    public List<RepairRequest> getByTenantId(Long tenantId) {
        return repairRequestRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<RepairRequest> getByRoomId(Long roomId) {
        return repairRequestRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
    }

    public RepairRequest createRequest(RepairRequestDTO dto) {
        // 1. Validate dữ liệu
        if (dto.getRoomId() == null) {
            Long roomId = contractService.getContractByTenantIdAndStatus(dto.getTenantId(), "ACTIVE").getRoom().getId();
            dto.setRoomId(roomId);
        }
        if (dto.getTenantId() == null) {
            throw new IllegalArgumentException("Mã người thuê (tenantId) không được để trống!");
        }

        // 2. Upload file trực tiếp lên Supabase
        String imageUrl = null;
        if (dto.getImage() != null && !dto.getImage().isEmpty()) {
            imageUrl = supabaseStorageService.storeFile(dto.getImage());
        }

        // 3. Khởi tạo Entity
        RepairRequest request = RepairRequest.builder()
                .tenantId(dto.getTenantId())
                .roomId(dto.getRoomId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory() != null ? dto.getCategory() : RepairRequest.Category.OTHER)
                .priority(dto.getPriority() != null ? dto.getPriority() : RepairRequest.Priority.MEDIUM)
                .status(RepairRequest.Status.PENDING)
                .imageUrl(imageUrl) // Sẽ lưu thẳng link public: https://...supabase.co/...
                .build();

        return repairRequestRepository.save(request);
    }

    public RepairRequest updateStatus(Long id, RepairRequest.Status newStatus) {
        RepairRequest request = repairRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu sửa chữa với ID: " + id));

        request.setStatus(newStatus);
        return repairRequestRepository.save(request);
    }

    @Transactional
    public RepairRequest updateRequest(Long id, RepairRequestDTO dto) {
        RepairRequest request = getById(id);
        request.setCategory(dto.getCategory());
        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setPriority(dto.getPriority());

        if (dto.getImage() != null && !dto.getImage().isEmpty()) {
            request.setImageUrl(supabaseStorageService.storeFile(dto.getImage()));
        } else if (dto.getImageUrl() != null) {
            request.setImageUrl(dto.getImageUrl());
        }

        return repairRequestRepository.save(request);
    }

    public void deleteRequest(Long id) {
        RepairRequest request = getById(id);
        repairRequestRepository.delete(request);
    }
}