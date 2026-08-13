package com.motel.backend.controller;

import com.motel.backend.dto.request.JoinMotelRequest;
import com.motel.backend.entity.Motel;
import com.motel.backend.entity.MotelTenant;
import com.motel.backend.entity.User;
import com.motel.backend.service.MotelService;
import com.motel.backend.service.MotelTenantService;
import com.motel.backend.service.NotificationService;
import com.motel.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/motel-tenants")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MotelTenantController {

    private final MotelTenantService motelTenantService;
    private final MotelService motelService;
    private final NotificationService notificationService;
    private final UserService userService;

    @PostMapping("/join")
    public ResponseEntity<?> joinMotel(@RequestBody JoinMotelRequest dto) {
        try {
            MotelTenant result = motelTenantService.joinMotelByInviteCode(dto);
            Motel motel = motelService.getMotelByInviteCode(dto.getInviteCode()).orElseThrow();
            User landlord = userService.getUserById(motel.getUser().getId());
            User tenant = userService.getUserById(dto.getTenantId());
            notificationService.createNotification(landlord.getId(), "Yêu cầu tham gia dãy trọ", "Bạn có yêu cầu tham gia dãy trọ từ " + tenant.getFullName(), "MotelTenant");
            return ResponseEntity.ok(Map.of(
                    "message", "Gửi yêu cầu tham gia dãy trọ thành công! Vui lòng chờ duyệt.",
                    "data", result
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/motel/{motelId}")
    public ResponseEntity<?> getTenantsByMotel(
            @PathVariable Long motelId,
            @RequestParam(required = false) String status) {
        try {
            List<MotelTenant> list = motelTenantService.getTenantsByMotelIdAndStatus(motelId, status);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMotelTenantByUserId(@PathVariable Long userId) {
        try {
            List<MotelTenant> list = motelTenantService.getMotelTenantsByUserId(userId);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveTenant(
            @PathVariable Long id,
            @RequestParam(required = false) Long roomId) {
        try {
            MotelTenant updated = motelTenantService.approveTenantRequest(id, roomId);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã phê duyệt khách thuê vào dãy trọ thành công!",
                    "data", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectTenant(@PathVariable Long id) {
        try {
            motelTenantService.rejectTenantRequest(id);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối yêu cầu gia nhập!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeTenant(@PathVariable Long id) {
        motelTenantService.removeTenantFromMotel(id);
        return ResponseEntity.ok("Đã gỡ khách thuê khỏi dãy trọ thành công!");
    }
}