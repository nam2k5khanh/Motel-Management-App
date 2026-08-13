package com.motel.backend.dto.request;

import lombok.Data;

@Data
public class JoinMotelRequest {
    private Long tenantId;
    private String inviteCode;
}
