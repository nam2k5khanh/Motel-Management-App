package com.motel.backend.controller;

import com.motel.backend.dto.request.ContractRequest;
import com.motel.backend.entity.Contract;
import com.motel.backend.entity.Room;
import com.motel.backend.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ContractController {

    @Autowired
    private ContractService contractService;

    @GetMapping
    public ResponseEntity<List<Contract>> getAllContracts() {
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contract> getContractById(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    @GetMapping("/tenant/{id}")
    public ResponseEntity<List<Contract>> getContractByTenantId(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractByTenantId(id));
    }

    @GetMapping("/tenant/{id}/{status}")
    public ResponseEntity<Contract> getContractByTenantIdAndStatus(@PathVariable Long id, @PathVariable String status) {
        return ResponseEntity.ok(contractService.getContractByTenantIdAndStatus(id, status));
    }

    @GetMapping("/landlord/{contractId}")
    public ResponseEntity<?> findLandlordIdByContractId(@PathVariable Long contractId) {
        Long landlordId = contractService.findLandlordIdByContractId(contractId);
        if (landlordId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy chủ trọ"));
        }
        // Trả về JSON: { "landlordId": 4 }
        return ResponseEntity.ok(Map.of("landlordId", landlordId));
    }

    @GetMapping("/room/{roomId}/status/{status}")
    public ResponseEntity<Contract> getContractByRoomIdAndStatus(
            @PathVariable Long roomId,
            @PathVariable String status) {
        return ResponseEntity.ok(contractService.getContractByRoomIdAndStatus(roomId, status));
    }

    // Endpoint mới lấy danh sách Contract active phục vụ cho hóa đơn
    @GetMapping("/active/motel/{motelId}")
    public ResponseEntity<List<Contract>> getActiveContractsByMotel(@PathVariable Long motelId) {
        return ResponseEntity.ok(contractService.getActiveContractsByMotelId(motelId));
    }

    @GetMapping("/active-rooms/motel/{motelId}")
    public ResponseEntity<List<Room>> getActiveRoomsByMotel(@PathVariable Long motelId) {
        return ResponseEntity.ok(contractService.getActiveRoomsByMotelId(motelId));
    }

    @PostMapping
    public ResponseEntity<?> createContract(@RequestBody ContractRequest request) {
        try {
            Contract newContract = contractService.createContract(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(newContract);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateContract(@PathVariable Long id, @RequestBody ContractRequest request) {
        try {
            Contract updatedContract = contractService.updateContract(id, request);
            return ResponseEntity.ok(updatedContract);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContract(@PathVariable Long id) {
        try {
            contractService.deleteContract(id);
            return ResponseEntity.ok("Xóa hợp đồng thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}