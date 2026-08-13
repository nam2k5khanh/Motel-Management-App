package com.motel.backend.service;

import com.motel.backend.dto.request.RoomRequest;
import com.motel.backend.entity.Motel;
import com.motel.backend.entity.Room;
import com.motel.backend.repository.MotelRepository;
import com.motel.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final MotelRepository motelRepository;

    // 1. Lấy danh sách phòng theo Dãy trọ
    public List<Room> getRoomsByMotelId(Long motelId) {
        return roomRepository.findByMotelId(motelId);
    }

    // 2. Lấy chi tiết 1 phòng theo ID
    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng với ID: " + id));
    }

    // 3. Thêm mới Phòng vào Dãy trọ
    public Room addRoom(Long motelId, RoomRequest request) {
        if (roomRepository.existsByMotelIdAndRoomCode(motelId, request.getRoomCode())) {
            throw new RuntimeException("Phòng " + request.getRoomCode() + " đã tồn tại trong dãy trọ này!");
        }
        Motel motel = motelRepository.findById(motelId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dãy trọ với ID: " + motelId));

        Room room = new Room();
        room.setRoomCode(request.getRoomCode());
        room.setArea(request.getArea());
        room.setPrice(request.getPrice());
        room.setMaxPeople(request.getMaxPeople() != null ? request.getMaxPeople() : 2);
        room.setStatus(request.getStatus() != null ? request.getStatus() : "EMPTY");
        room.setDescription(request.getDescription());
        room.setMotel(motel);

        return roomRepository.save(room);
    }

    // 4. Cập nhật thông tin Phòng
    public Room updateRoom(Long id, RoomRequest request) {
        Room room = getRoomById(id);

        room.setRoomCode(request.getRoomCode());
        room.setArea(request.getArea());
        room.setPrice(request.getPrice());
        room.setMaxPeople(request.getMaxPeople());
        room.setStatus(request.getStatus());
        room.setDescription(request.getDescription());

        return roomRepository.save(room);
    }

    // 5. Xóa Phòng
    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        roomRepository.delete(room);
    }

    // 6. Đổi trạng thái Phòng (VD: EMPTY <-> RENTED)
    public Room updateRoomStatus(Long id, String status) {
        Room room = getRoomById(id);
        room.setStatus(status);
        return roomRepository.save(room);
    }
}