package com.motel.backend.dto.request;

import com.motel.backend.entity.RepairRequest;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RepairUpdateStatus {
    private RepairRequest.Status status;
}