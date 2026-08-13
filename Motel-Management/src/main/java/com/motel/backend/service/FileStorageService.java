package com.motel.backend.service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileStorageService {

    private final Path rootLocation = Paths.get("uploads");

    public String storeFile(MultipartFile file) {
        try {
            // Tự động tạo thư mục uploads nếu chưa tồn tại
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

            if (file == null || file.isEmpty()) {
                return null;
            }

            // Đổi tên file để tránh trùng lặp bằng System.currentTimeMillis()
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String fileName = System.currentTimeMillis() + fileExtension;
            Path destinationFile = this.rootLocation.resolve(Paths.get(fileName))
                    .normalize().toAbsolutePath();

            // Lưu file vào đĩa
            Files.copy(file.getInputStream(), destinationFile);

            // Trả về đường dẫn tương đối để lưu vào CSDL
            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu file: " + e.getMessage());
        }
    }
}