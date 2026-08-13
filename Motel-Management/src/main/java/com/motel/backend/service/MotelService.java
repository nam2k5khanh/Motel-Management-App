package com.motel.backend.service;

import com.motel.backend.dto.request.MotelRequest;
import com.motel.backend.entity.Motel;
import com.motel.backend.repository.MotelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MotelService {
    @Autowired
    private MotelRepository motelRepository;

    @Autowired
    private UserService userService;

    public List<Motel> getMotelsByUserID(String userID) {
        return motelRepository.findByUserId(userID);
    };

    public Motel addMotel(MotelRequest request) {
        Motel motel = new Motel();
        motel.setName(request.getName());
        motel.setAddress(request.getAddress());
        motel.setUser(userService.getUserById(request.getUserId()));
        motel.setDescription(request.getDescription());

        return motelRepository.save(motel);
    }

    public Motel getMotelById(Long id) {
        return motelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dãy trọ với ID: " + id));
    }

    public Optional<Motel> getMotelByInviteCode(String inviteCode) {
        return motelRepository.findByInviteCodeIgnoreCase(inviteCode);
    }

    public Motel updateMotel(Long id, MotelRequest motelDetails) {
        Motel existingMotel = getMotelById(id);
        existingMotel.setName(motelDetails.getName());
        existingMotel.setAddress(motelDetails.getAddress());
        existingMotel.setDescription(motelDetails.getDescription());
        if (motelDetails.getUserId() != null) {
            existingMotel.setUser(userService.getUserById(motelDetails.getUserId()));
        }

        // 3. Lưu vào Database
        return motelRepository.save(existingMotel);
    }

    public void deleteMotel(Long id) {
        Motel existingMotel = getMotelById(id);
        motelRepository.delete(existingMotel);
    }
}