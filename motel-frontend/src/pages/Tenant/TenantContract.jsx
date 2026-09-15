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
    <div className="d-flex flex-column min-vh-100 bg-light w-100 overflow-x-hidden">
      {/* CSS tối ưu cho chế độ in (Print/PDF) & Mobile Layout */}
      <style>
        {`
          .main-content-area {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          @media (min-width: 992px) {
            .main-content-area {
              margin-left: 260px !important;
              width: calc(100% - 260px) !important;
            }
          }
          @media print {
            body { background-color: #fff !important; color: #000 !important; }
            .d-print-none, sidebar, nav, header { display: none !important; }
            .main-content-area { margin-left: 0 !important; padding: 0 !important; width: 100% !important; }
            .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; width: 100% !important; }
          }
        `}
      </style>

      {/* Header Mobile - Tự động ẩn khi ở chế độ in */}
      <header className="navbar navbar-dark bg-primary sticky-top px-3 shadow-sm d-lg-none d-print-none" style={{ zIndex: 1030, height: '56px' }}>
        <div className="d-flex align-items-center w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-link text-white p-0 border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
              <i className="bi bi-list fs-3"></i>
            </button>
            <span className="navbar-brand fw-bold mb-0 me-0 fs-6">HỢP ĐỒNG THUÊ</span>
          </div>
          <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            {tenant?.fullName ? tenant.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="d-flex flex-grow-1 w-100">
        {/* Sidebar */}
        <div className="d-print-none">
          <TenantSidebar />
        </div>

        {/* Nội dung chính */}
        <div className="main-content-area flex-grow-1 p-3 p-md-4 overflow-hidden">
          {/* Header Action Bar */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 d-print-none">
            
            {contract && (
              <button onClick={handlePrint} className="btn btn-primary fw-bold rounded-pill px-4 align-self-start align-self-sm-auto">
                <i className="bi bi-printer me-2"></i>In / Tải Hợp Đồng (PDF)
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted small">Đang tải thông tin hợp đồng...</p>
            </div>
          ) : !contract ? (
            <div className="row justify-content-center py-4">
              <div className="col-12 col-md-8 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 text-center p-4 p-md-5 bg-white">
                  <div className="mb-3">
                    <span className="fs-1 text-muted">📑</span>
                  </div>
                  <h5 className="fw-bold text-secondary mb-2">Chưa Tìm Thấy Hợp Đồng</h5>
                  <p className="text-muted small mb-0">
                    Tài khoản của bạn hiện chưa được gắn với hợp đồng thuê nhà nào đang có hiệu lực.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Khung chi tiết hợp đồng */
            <div className="card border-0 shadow-sm rounded-4 p-3 p-sm-4 p-md-5 bg-white print-area">
              {/* TIÊU ĐỀ HỢP ĐỒNG */}
              <div className="text-center mb-4 pb-3 border-bottom">
                <h6 className="fw-bold text-uppercase mb-1 fs-6 fs-md-5">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h6>
                <p className="fw-semibold text-muted mb-3 small">Độc lập - Tự do - Hạnh phúc</p>
                <h4 className="fw-bold text-primary text-uppercase mt-3 mb-1 fs-5 fs-md-3">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h4>
                <p className="text-muted small mb-0">Mã hợp đồng: <strong>#{contract.id}</strong></p>
              </div>

              {/* THÔNG TIN BÊN A & BÊN B (Auto Wrap trên Mobile) */}
              <div className="row g-3 g-md-4 mb-4">
                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100 border">
                    <h6 className="fw-bold text-primary mb-3 text-uppercase fs-6">🏠 BÊN CHO THUÊ (BÊN A)</h6>
                    <p className="mb-2 small"><strong>Họ và tên:</strong> {landlord?.fullName || landlord?.name || '---'}</p>
                    <p className="mb-2 small"><strong>Số điện thoại:</strong> {landlord?.phoneNumber || landlord?.phone || '---'}</p>
                    <p className="mb-0 small"><strong>Số CCCD:</strong> {landlord?.cccd || '---'}</p>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 h-100 border">
                    <h6 className="fw-bold text-primary mb-3 text-uppercase fs-6">👤 BÊN THUÊ (BÊN B)</h6>
                    <p className="mb-2 small"><strong>Họ và tên:</strong> {tenant?.fullName || tenant?.name || '---'}</p>
                    <p className="mb-2 small"><strong>Số điện thoại:</strong> {tenant?.phoneNumber || tenant?.phone || '---'}</p>
                    <p className="mb-0 small"><strong>Số CCCD:</strong> {tenant?.cccd || '---'}</p>
                  </div>
                </div>
              </div>

              {/* BẢNG GIÁ & THỜI HẠN */}
              <h6 className="fw-bold text-dark mb-3 fs-6">📌 THÔNG TIN PHÒNG & GIÁ THUÊ</h6>
              <div className="table-responsive mb-4">
                <table className="table table-bordered align-middle mb-0 small">
                  <tbody>
                    <tr>
                      <td className="bg-light fw-semibold text-nowrap" style={{ width: '20%' }}>Mã phòng:</td>
                      <td><strong className="text-primary">Phòng {contract.room?.roomCode || contract.roomId}</strong></td>
                      <td className="bg-light fw-semibold text-nowrap" style={{ width: '20%' }}>Tiền đặt cọc:</td>
                      <td><strong className="text-danger">{(contract.deposit || 0).toLocaleString('vi-VN')} VNĐ</strong></td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-semibold text-nowrap">Giá thuê phòng:</td>
                      <td><strong className="text-success">{(contract.rentPrice || 0).toLocaleString('vi-VN')} VNĐ/tháng</strong></td>
                      <td className="bg-light fw-semibold text-nowrap">Thời hạn:</td>
                      <td>{contract.startDate} đến {contract.endDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ĐIỀU KHOẢN VÀ CÁC QUY ĐỊNH */}
              <h6 className="fw-bold text-dark mb-2 fs-6">📜 ĐIỀU KHOẢN VÀ CÁC QUY ĐỊNH</h6>
              <div className="p-3 bg-light rounded-3 text-secondary small mb-4 border">
                <ol className="mb-0 ps-3">
                  <li className="mb-2">Bên B thanh toán tiền nhà đầy đủ trước ngày 05 hằng tháng.</li>
                  <li className="mb-2">Bên B tuân thủ quy định phòng cháy chữa cháy và giữ gìn vệ sinh chung.</li>
                  <li className="mb-0">Nếu hủy hợp đồng trước thời hạn mà không báo trước 30 ngày, Bên B sẽ không nhận lại tiền đặt cọc.</li>
                </ol>
              </div>

              {/* TRẠNG THÁI & XÁC NHẬN */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 border-top pt-3">
                <div className="d-flex align-items-center">
                  <span className="text-muted me-2 small">Trạng thái:</span>
                  <span className={`badge ${contract.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} px-3 py-2 fw-bold rounded-pill`}>
                    {contract.status === 'ACTIVE' ? 'ĐANG HIỆU LỰC' : 'ĐÃ HẾT HẠN'}
                  </span>
                </div>
                <div className="text-sm-end text-muted small">
                  <i>Hợp đồng điện tử được xác nhận trên hệ thống.</i>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}