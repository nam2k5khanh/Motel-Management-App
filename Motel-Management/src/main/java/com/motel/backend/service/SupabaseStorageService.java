package com.motel.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    // Thêm các thông số này vào application.properties
    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket-name:motel-images}")
    private String bucketName;

    public String uploadFile(MultipartFile file) throws IOException {
        // Tạo tên file ngẫu nhiên để tránh trùng lặp (vd: 550e8400-e29b...-phong1.jpg)
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();

        // URL Endpoint upload của Supabase Storage API
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + fileName;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.set("apiKey", supabaseKey);
        headers.setContentType(MediaType.valueOf(file.getContentType()));

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

        // Gọi API PUT đẩy file lên Supabase
        ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.PUT, requestEntity, String.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            // Trả về URL công khai của ảnh để lưu vào MySQL Database
            return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + fileName;
        } else {
            throw new RuntimeException("Lỗi upload ảnh lên Supabase: " + response.getBody());
        }
    }
}