package com.motel.backend.controller;

import com.motel.backend.dto.RepairRequestDTO;
import com.motel.backend.dto.request.RepairUpdateStatus;
import com.motel.backend.entity.RepairRequest;
import com.motel.backend.service.RepairRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair-requests")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RepairRequestController {

    @Autowired
    private RepairRequestService repairRequestService;

    // 1. THÊM PHƯƠNG THỨC POST ĐỂ TẠO YÊU CẦU MỚI (Dùng @ModelAttribute nhận FormData)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createRequest(@ModelAttribute RepairRequestDTO dto) {
        try {
            RepairRequest created = repairRequestService.createRequest(dto);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Lấy tất cả danh sách sự cố (Cho Chủ trọ / Admin)
    @GetMapping
    public ResponseEntity<List<RepairRequest>> getAllRequests() {
        return ResponseEntity.ok(repairRequestService.getAllRequests());
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<RepairRequest>> getRequestsByTenantId(@PathVariable Long tenantId) {
        List<RepairRequest> requests = repairRequestService.getByTenantId(tenantId);
        return ResponseEntity.ok(requests);
    }

    // 3. Lấy chi tiết 1 sự cố theo ID
    @GetMapping("/{id}")
    public ResponseEntity<RepairRequest> getById(@PathVariable Long id) {
        return ResponseEntity.ok(repairRequestService.getById(id));
    }

    // 4. Cập nhật trạng thái sự cố
    @PutMapping("/{id}/status")
    public ResponseEntity<RepairRequest> updateStatus(
            @PathVariable Long id,
            @RequestBody RepairUpdateStatus request) {
        RepairRequest updated = repairRequestService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }
}