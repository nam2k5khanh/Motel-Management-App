package com.motel.backend.controller;
import com.motel.backend.entity.LandlordBank;
import com.motel.backend.service.LandlordBankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/landlord-bank")
@CrossOrigin(origins = "*")
public class LandlordBankController {

    @Autowired
    private LandlordBankService landlordBankService;

    // 1. Lấy thông tin ngân hàng của chủ trọ theo landlordId
    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<LandlordBank> getBankByLandlordId(@PathVariable Long landlordId) {
        return landlordBankService.getBankByLandlordId(landlordId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. Cấu hình (Lưu/Cập nhật) tài khoản ngân hàng cho chủ trọ
    @PutMapping("/landlord/{landlordId}")
    public ResponseEntity<LandlordBank> saveOrUpdateBankInfo(
            @PathVariable Long landlordId,
            @RequestBody LandlordBank bankData) {
        LandlordBank updatedBank = landlordBankService.saveOrUpdateBankInfo(landlordId, bankData);
        return ResponseEntity.ok(updatedBank);
    }

    // 3. Lấy thông tin ngân hàng của chủ trọ thông qua invoiceId (dùng cho Frontend người thuê tạo VietQR)
    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<LandlordBank> getBankByInvoiceId(@PathVariable Long invoiceId) {
        return landlordBankService.getBankByInvoiceId(invoiceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Xóa cấu hình ngân hàng
    @DeleteMapping("/landlord/{landlordId}")
    public ResponseEntity<Void> deleteBankInfo(@PathVariable Long landlordId) {
        landlordBankService.deleteBankByLandlordId(landlordId);
        return ResponseEntity.noContent().build();
    }
}