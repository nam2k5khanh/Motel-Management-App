package com.motel.backend.service;

import com.motel.backend.dto.InvoiceDTO;
import com.motel.backend.entity.Contract;
import com.motel.backend.entity.ElectricityWater;
import com.motel.backend.entity.Invoice;
import com.motel.backend.entity.Room;
import com.motel.backend.repository.ContractRepository;
import com.motel.backend.repository.ElectricityWaterRepository;
import com.motel.backend.repository.InvoiceRepository;
import com.motel.backend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private ElectricityWaterRepository electricityWaterRepository;

    public List<Invoice> getByMotelAndMonthYear(Long motelId, Integer month, Integer year) {
        return invoiceRepository.findByRoomMotelIdAndMonthAndYear(motelId, month, year);
    }

    public Invoice getById(Long id) {
        return invoiceRepository.findById(id).orElse(null);
    }

    public Invoice getLastestByTenantId(Long tenantId) {
        return invoiceRepository.findLatestByTenantId(tenantId).orElse(null);
    }

    public List<Invoice> getByContractId(Long contractId) {
        return invoiceRepository.findByContractId(contractId);
    }

    @Transactional
    public Invoice createInvoice(InvoiceDTO dto) {
        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng!"));
        Contract contract = null;
        if (dto.getContractId() != null) {
            contract = contractRepository.findById(dto.getContractId()).orElse(null);
        }

        ElectricityWater ew = null;
        if (dto.getElectricityWaterId() != null) {
            ew = electricityWaterRepository.findById(dto.getElectricityWaterId()).orElse(null);
        }

        Invoice invoice = new Invoice();
        invoice.setRoom(room);
        invoice.setContract(contract);
        invoice.setElectricityWater(ew);
        invoice.setMonth(dto.getMonth());
        invoice.setYear(dto.getYear());
        invoice.setRoomFee(dto.getRoomFee());
        invoice.setElectricFee(dto.getElectricFee());
        invoice.setWaterFee(dto.getWaterFee());
        invoice.setOtherFee(dto.getOtherFee());
        invoice.setTotal(dto.getTotal());
        invoice.setStatus("UNPAID"); // Mặc định là chưa thanh toán

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateStatus(Long id, String status) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn!"));
        invoice.setStatus(status);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
}