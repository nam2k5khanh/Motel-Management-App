package com.motel.backend.controller;

import com.motel.backend.dto.DashboardDTO;
import com.motel.backend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardDTO> getLandlordSummary(@RequestParam(name = "userId", required = false) Long userId) {
        DashboardDTO stats = dashboardService.getLandlordSummary(userId);
        return ResponseEntity.ok(stats);
    }
}