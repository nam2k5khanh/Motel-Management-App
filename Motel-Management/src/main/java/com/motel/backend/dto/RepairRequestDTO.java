package com.motel.backend.dto;

import com.motel.backend.entity.RepairRequest;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class RepairRequestDTO {
    private Long tenantId;
    private Long roomId;
    private RepairRequest.Category category;
    private String title;
    private String description;
    private RepairRequest.Priority priority;
    private String imageUrl;

    private MultipartFile image;
}