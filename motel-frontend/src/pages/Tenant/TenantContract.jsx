import React, { useState, useEffect, useCallback } from 'react';
import TenantSidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function TenantContract() {
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [landlord, setLandlord] = useState(null);
  const [tenant, setTenant] = useState(null);

  const fetchContractData = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      // Step 1: Lấy hợp đồng ACTIVE của Khách thuê
      const resContract = await axiosClient.get(`/contracts/tenant/${userId}/ACTIVE`);
      const contractData = resContract.data;
      setContract(contractData);

      // Step 2: Lấy landlordId từ API phụ
      let landlordId = null;
      try {
        const resLandlordId = await axiosClient.get(`/contracts/landlord/${contractData.id}`);
        landlordId = resLandlordId.data?.landlordId;
      } catch (err) {
        console.warn('Không thể lấy landlordId:', err);
      }

      // Step 3: Tải SONG SONG thông tin Khách thuê và Chủ trọ
      const [tenantRes, landlordRes] = await Promise.all([
        axiosClient.get(`/users/${userId}`),
        landlordId ? axiosClient.get(`/users/${landlordId}`) : Promise.resolve(null)
      ]);

      if (tenantRes?.data) setTenant(tenantRes.data);
      if (landlordRes?.data) setLandlord(landlordRes.data);

    } catch (err) {
      if (err.response?.status === 404) {
        setContract(null);
      } else {
        console.error('Lỗi khi tải thông tin hợp đồng:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}')?.id;
    if (userId) {
      fetchContractData(userId);
    } else {
      setIsLoading(false);
    }
  }, [fetchContractData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="d-flex">
      {/* CSS dành riêng cho chế độ in (Print/PDF) */}
      <style>
        {`
          @media print {
            body { background-color: #fff !important; color: #000 !important; }
            .d-print-none, sidebar, nav { display: none !important; }
            .main-content-area { margin-left: 0 !important; padding: 0 !important; }
            .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; width: 100% !important; }
          }
        `}
      </style>

      {/* Sidebar */}
      <div className="d-print-none">
        <TenantSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100 main-content-area" style={{ marginLeft: '260px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
          <h3 className="fw-bold m-0">📄 Hợp Đồng Thuê Nhà</h3>
          {contract && (
            <button onClick={handlePrint} className="btn btn-primary fw-bold">
              <i className="bi bi-printer me-2"></i>In / Tải Hợp Đồng (PDF)
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Đang tải thông tin hợp đồng...</p>
          </div>
        ) : !contract ? (
          <div className="card border-0 shadow-sm rounded-4 text-center p-5">
            <h5 className="fw-bold text-secondary">Chưa tìm thấy hợp đồng</h5>
            <p className="text-muted">Tài khoản của bạn hiện chưa được gắn với hợp đồng thuê nhà nào đang có hiệu lực.</p>
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white print-area">
            {/* TIÊU ĐỀ */}
            <div className="text-center mb-4 pb-3 border-bottom">
              <h5 className="fw-bold text-uppercase mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h5>
              <p className="fw-semibold text-muted mb-3">Độc lập - Tự do - Hạnh phúc</p>
              <h3 className="fw-bold text-primary text-uppercase mt-3">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h3>
              <p className="text-muted small">Mã hợp đồng: <strong>#{contract.id}</strong></p>
            </div>

            {/* BÊN A & BÊN B */}
            <div className="row g-4 mb-4">
              <div className="col-6">
                <div className="p-3 bg-light rounded-3 h-100 border">
                  <h6 className="fw-bold text-primary mb-3">🏠 BÊN CHO THUÊ (BÊN A)</h6>
                  <p className="mb-2"><strong>Họ và tên:</strong> {landlord?.fullName || landlord?.name || '---'}</p>
                  <p className="mb-2"><strong>Số điện thoại:</strong> {landlord?.phoneNumber || landlord?.phone || '---'}</p>
                  <p className="mb-0"><strong>Số CCCD:</strong> {landlord?.cccd || '---'}</p>
                </div>
              </div>

              <div className="col-6">
                <div className="p-3 bg-light rounded-3 h-100 border">
                  <h6 className="fw-bold text-primary mb-3">👤 BÊN THUÊ (BÊN B)</h6>
                  <p className="mb-2"><strong>Họ và tên:</strong> {tenant?.fullName || tenant?.name || '---'}</p>
                  <p className="mb-2"><strong>Số điện thoại:</strong> {tenant?.phoneNumber || tenant?.phone || '---'}</p>
                  <p className="mb-0"><strong>Số CCCD:</strong> {tenant?.cccd || '---'}</p>
                </div>
              </div>
            </div>

            {/* BẢNG GIÁ & THỜI HẠN */}
            <h6 className="fw-bold text-dark mb-3">📌 THÔNG TIN PHÒNG & GIÁ THUÊ</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered align-middle mb-0">
                <tbody>
                  <tr>
                    <td className="bg-light fw-semibold" style={{ width: '25%' }}>Mã phòng:</td>
                    <td><strong className="text-primary">Phòng {contract.room?.roomCode || contract.roomId}</strong></td>
                    <td className="bg-light fw-semibold" style={{ width: '25%' }}>Tiền đặt cọc:</td>
                    <td><strong className="text-danger">{(contract.deposit || 0).toLocaleString('vi-VN')} VNĐ</strong></td>
                  </tr>
                  <tr>
                    <td className="bg-light fw-semibold">Giá thuê phòng:</td>
                    <td><strong className="text-success">{(contract.rentPrice || 0).toLocaleString('vi-VN')} VNĐ/tháng</strong></td>
                    <td className="bg-light fw-semibold">Thời hạn hợp đồng:</td>
                    <td>{contract.startDate} đến {contract.endDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ĐIỀU KHOẢN */}
            <h6 className="fw-bold text-dark mb-2">📜 ĐIỀU KHOẢN VÀ CÁC QUY ĐỊNH</h6>
            <div className="p-3 bg-light rounded-3 text-secondary small mb-4 border">
              <ol className="mb-0 ps-3">
                <li className="mb-2">Bên B thanh toán tiền nhà đầy đủ trước ngày 05 hằng tháng.</li>
                <li className="mb-2">Bên B tuân thủ quy định phòng cháy chữa cháy và giữ gìn vệ sinh chung.</li>
                <li className="mb-0">Nếu hủy hợp đồng trước thời hạn mà không báo trước 30 ngày, Bên B sẽ không nhận lại tiền đặt cọc.</li>
              </ol>
            </div>

            {/* TRẠNG THÁI */}
            <div className="d-flex justify-content-between align-items-center border-top pt-4">
              <div>
                <span className="text-muted me-2">Trạng thái:</span>
                <span className={`badge ${contract.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} px-3 py-2 fw-bold`}>
                  {contract.status === 'ACTIVE' ? 'ĐANG HIỆU LỰC' : 'ĐÃ HẾT HẠN'}
                </span>
              </div>
              <div className="text-end text-muted small">
                <i>Hợp đồng điện tử được xác nhận trên hệ thống.</i>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}