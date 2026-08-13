package com.motel.backend.service;

import com.motel.backend.dto.request.JoinMotelRequest;
import com.motel.backend.entity.Motel;
import com.motel.backend.entity.MotelTenant;
import com.motel.backend.entity.Room;
import com.motel.backend.entity.User;
import com.motel.backend.repository.MotelRepository;
import com.motel.backend.repository.MotelTenantRepository;
import com.motel.backend.repository.RoomRepository;
import com.motel.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MotelTenantService {

    private final MotelTenantRepository motelTenantRepository;
    private final UserRepository userRepository;
    private final MotelRepository motelRepository;
    private final NotificationService notificationService;

    /**
     * 1. Khách thuê gửi yêu cầu gia nhập dãy trọ bằng Mã Mời
     */
    @Transactional
    public MotelTenant joinMotelByInviteCode(JoinMotelRequest dto) {
        // Kiểm tra khách thuê có tồn tại không
        User tenant = userRepository.findById(dto.getTenantId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin khách thuê!"));

        // Tìm dãy trọ theo Mã Mời (Invite Code)
        Motel motel = motelRepository.findByInviteCodeIgnoreCase(dto.getInviteCode())
                .orElseThrow(() -> new RuntimeException("Mã mời không tồn tại hoặc đã hết hạn!"));

        // Kiểm tra xem khách thuê đã gửi yêu cầu cho dãy trọ này chưa
        Optional<MotelTenant> existingOpt = motelTenantRepository.findByTenantIdAndMotelId(tenant.getId(), motel.getId());

        if (existingOpt.isPresent()) {
            MotelTenant existing = existingOpt.get();
            existing.setStatus(MotelTenant.Status.PENDING);
            return motelTenantRepository.save(existing);
        }
        MotelTenant motelTenant = new MotelTenant();
        motelTenant.setTenantId(tenant.getId());
        motelTenant.setMotelId(motel.getId());
        motelTenant.setStatus(MotelTenant.Status.PENDING);
        return motelTenantRepository.save(motelTenant);
    }

    public List<MotelTenant> getMotelTenantsByUserId(Long userId) {
        return motelTenantRepository.findByTenantId(userId);
    }

    /**
     * 3. Lấy danh sách khách thuê theo Dãy Trọ (Có thể lọc theo status PENDING/APPROVED)
     */
    public List<MotelTenant> getTenantsByMotelIdAndStatus(Long motelId, String status) {
        if (status != null && !status.trim().isEmpty()) {
            return motelTenantRepository.findByMotelIdAndStatus(motelId, status.toUpperCase());
        }
        return motelTenantRepository.findByMotelId(motelId);
    }

    /**
     * 4. Chủ trọ Phê Duyệt khách thuê (Có thể gán Phòng luôn nếu truyền roomId)
     */
    @Transactional
    public MotelTenant approveTenantRequest(Long id, Long roomId) {
        MotelTenant motelTenant = motelTenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yêu cầu gia nhập không tồn tại!"));

        // Cập nhật trạng thái thành APPROVED
        motelTenant.setStatus(MotelTenant.Status.APPROVED);



        return motelTenantRepository.save(motelTenant);
    }

    /**
     * 5. Chủ trọ Từ Chối yêu cầu gia nhập
     */
    @Transactional
    public void rejectTenantRequest(Long id) {
        MotelTenant motelTenant = motelTenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yêu cầu gia nhập không tồn tại!"));

        motelTenant.setStatus(MotelTenant.Status.REJECTED);
        motelTenantRepository.save(motelTenant);
    }

    public void removeTenantFromMotel(Long id) {
        MotelTenant tenant = motelTenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin khách thuê"));

        tenant.setStatus(MotelTenant.Status.REMOVED);
        motelTenantRepository.save(tenant);
    }
}