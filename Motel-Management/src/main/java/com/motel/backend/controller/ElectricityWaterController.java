package com.motel.backend.controller;

import com.motel.backend.dto.ElectricityWaterDTO;
import com.motel.backend.entity.ElectricityWater;
import com.motel.backend.service.ElectricityWaterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/electricity-water")
@CrossOrigin(origins = "*")
public class ElectricityWaterController {

    @Autowired
    private ElectricityWaterService service;

    @GetMapping
    public ResponseEntity<List<ElectricityWater>> getByMonthAndYear(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        if (month != null && year != null) {
            return ResponseEntity.ok(service.getByMonthAndYear(month, year));
        }
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ElectricityWater> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<ElectricityWater> create(@RequestBody ElectricityWaterDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ElectricityWater> update(@PathVariable Long id, @RequestBody ElectricityWaterDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}