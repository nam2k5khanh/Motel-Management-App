package com.motel.backend.controller;

import com.motel.backend.dto.request.RoomRequest;
import com.motel.backend.entity.Room;
import com.motel.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @GetMapping("/motel/{motelId}")
    public ResponseEntity<List<Room>> getRoomsByMotel(@PathVariable Long motelId) {
        return ResponseEntity.ok(roomService.getRoomsByMotelId(motelId));
    }

    @PostMapping("/motel/{motelId}")
    public ResponseEntity<Room> createRoom(@PathVariable Long motelId, @RequestBody RoomRequest room) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomService.addRoom(motelId, room));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @RequestBody RoomRequest room) {
        return ResponseEntity.ok(roomService.updateRoom(id, room));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok("Xóa phòng thành công!");
    }
}