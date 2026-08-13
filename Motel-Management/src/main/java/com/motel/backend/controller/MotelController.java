package com.motel.backend.controller;

import com.motel.backend.dto.request.MotelRequest;
import com.motel.backend.entity.Motel;
import com.motel.backend.service.MotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/motels")
@CrossOrigin(origins = "*")
public class MotelController {
    @Autowired
    MotelService motelService;

    @GetMapping
    public ResponseEntity<List<Motel>> getMotelsByLandlord(@RequestParam("userId") String userId) {
        List<Motel> motels = motelService.getMotelsByUserID(userId);
        return ResponseEntity.ok(motels);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMotelById(@PathVariable Long id) {
        return ResponseEntity.ok(motelService.getMotelById(id));
    }

    @GetMapping("/invite-code/{inviteCode}")
    public ResponseEntity<?> getMotelByInviteCode(@PathVariable String inviteCode) {
        try {
            return motelService.getMotelByInviteCode(inviteCode)
                    .map(motel -> {
                        // Tùy chọn: Chuẩn hóa dữ liệu trả về DTO/Map
                        Map<String, Object> response = new HashMap<>();
                        response.put("id", motel.getId());
                        response.put("name", motel.getName());
                        response.put("address", motel.getAddress());
                        response.put("inviteCode", motel.getInviteCode());
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("message", "Mã mời không tồn tại hoặc đã hết hạn!")));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> addMotel(@RequestBody MotelRequest request) {
        try {
            Motel newMotel = motelService.addMotel(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(newMotel);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Motel> updateMotel(@PathVariable Long id, @RequestBody MotelRequest motel) {
        return ResponseEntity.ok(motelService.updateMotel(id, motel));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMotel(@PathVariable Long id) {
        motelService.deleteMotel(id);
        return ResponseEntity.ok("Xóa dãy trọ thành công!");
    }
}
