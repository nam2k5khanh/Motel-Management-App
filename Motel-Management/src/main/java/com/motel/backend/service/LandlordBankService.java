package com.motel.backend.service;
import com.motel.backend.entity.Invoice;
import com.motel.backend.entity.LandlordBank;
import com.motel.backend.repository.LandlordBankRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class LandlordBankService {

    @Autowired
    private LandlordBankRepository landlordBankRepository;
    @Autowired
    private ContractService contractService;
    @Autowired
    private InvoiceService invoiceService;

    // 1. Lấy thông tin tài khoản ngân hàng theo landlordId
    @Transactional(readOnly = true)
    public Optional<LandlordBank> getBankByLandlordId(Long landlordId) {
        return landlordBankRepository.findByLandlordId(landlordId);
    }

    // 2. Lưu hoặc cập nhật thông tin ngân hàng của chủ trọ
    public LandlordBank saveOrUpdateBankInfo(Long landlordId, LandlordBank bankData) {
        return landlordBankRepository.findByLandlordId(landlordId)
                .map(existingBank -> {
                    // Cập nhật nếu đã tồn tại
                    existingBank.setBankCode(bankData.getBankCode());
                    existingBank.setBankName(bankData.getBankName());
                    existingBank.setAccountNumber(bankData.getAccountNumber());
                    existingBank.setAccountHolder(bankData.getAccountHolder().toUpperCase()); // Luôn viết hoa
                    if (bankData.getIsActive() != null) {
                        existingBank.setIsActive(bankData.getIsActive());
                    }
                    return landlordBankRepository.save(existingBank);
                })
                .orElseGet(() -> {
                    // Tạo mới nếu chưa có
                    bankData.setLandlordId(landlordId);
                    bankData.setAccountHolder(bankData.getAccountHolder().toUpperCase());
                    if (bankData.getIsActive() == null) {
                        bankData.setIsActive(true);
                    }
                    return landlordBankRepository.save(bankData);
                });
    }

    // 3. Lấy thông tin ngân hàng theo mã Hóa đơn (invoiceId) để làm VietQR
    public Optional<LandlordBank> getBankByInvoiceId(Long invoiceId) {
        Invoice invoice = invoiceService.getById(invoiceId);
        Long landlordId = contractService.findLandlordIdByContractId(invoice.getContract().getId());
        return landlordBankRepository.findByLandlordId(landlordId);
    }

    // 4. Xóa thông tin ngân hàng
    public void deleteBankByLandlordId(Long landlordId) {
        landlordBankRepository.findByLandlordId(landlordId)
                .ifPresent(bank -> landlordBankRepository.delete(bank));
    }
}