package com.motel.backend.controller;

import com.motel.backend.dto.InvoiceDTO;
import com.motel.backend.entity.Invoice;
import com.motel.backend.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<Invoice>> getInvoices(
            @RequestParam(required = false) Long motelId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(invoiceService.getByMotelAndMonthYear(motelId, month, year));
    }

    @RequestMapping("/contract/{contractId}")
    public ResponseEntity<List<Invoice>> getInvoiceByContractId(@PathVariable Long contractId) {
        return ResponseEntity.ok(invoiceService.getByContractId(contractId));
    }

    @GetMapping("/latest/{tenantId}")
    public ResponseEntity<?> getLatestInvoice(@PathVariable Long tenantId) {
        return ResponseEntity.ok(invoiceService.getLastestByTenantId(tenantId));
    }

    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody InvoiceDTO dto) {
        try {
            Invoice newInvoice = invoiceService.createInvoice(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(newInvoice);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Invoice updated = invoiceService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id) {
        try {
            invoiceService.deleteInvoice(id);
            return ResponseEntity.ok("Xóa hóa đơn thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}