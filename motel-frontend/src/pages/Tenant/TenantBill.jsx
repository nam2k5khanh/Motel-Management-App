import React, { useState, useEffect, useCallback } from 'react';
import TenantSidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function TenantBill() {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [landlordBank, setLandlordBank] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);

  // Tải thông tin tài khoản ngân hàng của chủ trọ theo Invoice ID
  const fetchLandlordBankInfo = useCallback(async (invoiceId) => {
    if (!invoiceId) {
      setLandlordBank(null);
      return;
    }
    try {
      const res = await axiosClient.get(`/landlord-bank/invoice/${invoiceId}`);
      if (res.data) {
        setLandlordBank(res.data);
      } else {
        setLandlordBank(null);
      }
    } catch (err) {
      console.warn(`Không thể lấy thông tin ngân hàng chủ trọ cho Hóa đơn #${invoiceId}:`, err);
      setLandlordBank(null);
    }
  }, []);

  // Tải danh sách hóa đơn & Lấy thông tin RoomID từ Contract
  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}')?.id;
    
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      let contractId = null;
      let roomIdFromContract = null;

      // 1. Lấy thông tin Hợp đồng ACTIVE
      try {
        const contractRes = await axiosClient.get(`/contracts/tenant/${userId}/ACTIVE`);
        if (contractRes.data) {
          contractId = contractRes.data.id;
          roomIdFromContract = contractRes.data.roomId || contractRes.data.room_id || contractRes.data.room?.id;
        }
      } catch (err) {
        console.warn('Không tìm thấy hợp đồng ACTIVE...', err);
      }

      // 2. Lấy chi tiết thông tin Phòng
      if (roomIdFromContract) {
        try {
          const roomRes = await axiosClient.get(`/rooms/${roomIdFromContract}`);
          setRoomInfo(roomRes.data);
        } catch (err) {
          console.warn('Không thể lấy chi tiết thông tin phòng:', err);
        }
      }

      // 3. Gọi API lấy danh sách hóa đơn
      let billData = [];
      if (contractId) {
        const res = await axiosClient.get(`/invoices/contract/${contractId}`);
        billData = res.data || [];
      } else {
        const res = await axiosClient.get(`/invoices/tenant/${userId}`);
        billData = res.data || [];
      }

      setBills(billData);

      // 4. Chọn hóa đơn mặc định
      if (billData.length > 0) {
        const latestUnpaid = billData.find((b) => b.status === 'UNPAID' || b.status === 'PENDING') || billData[0];
        setSelectedBill(latestUnpaid);
        fetchLandlordBankInfo(latestUnpaid.id);
      } else {
        setSelectedBill(null);
        setLandlordBank(null);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách hóa đơn:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLandlordBankInfo]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Xử lý khi người dùng click chọn hóa đơn khác
  const handleSelectBill = (bill) => {
    setSelectedBill(bill);
    if (bill?.id) {
      fetchLandlordBankInfo(bill.id);
    }
  };

  // Các hàm bổ trợ đọc dữ liệu linh hoạt
  const getTotalAmount = (bill) => bill?.total ?? bill?.totalAmount ?? bill?.totalFee ?? bill?.amount ?? 0;
  const getRoomFee = (bill) => bill?.roomFee ?? bill?.room_fee ?? bill?.roomPrice ?? 0;
  const getElectricFee = (bill) => bill?.electricFee ?? bill?.electric_fee ?? bill?.electricityAmount ?? 0;
  const getWaterFee = (bill) => bill?.waterFee ?? bill?.water_fee ?? bill?.waterAmount ?? 0;
  const getOtherFee = (bill) => bill?.otherFee ?? bill?.other_fee ?? bill?.otherServiceAmount ?? 0;

  // Lấy hiển thị tên/số phòng
  const displayRoomName = () => {
    if (roomInfo) {
      return roomInfo.roomCode || roomInfo.roomNumber || roomInfo.name || roomInfo.code || `P${roomInfo.id}`;
    }
    return selectedBill?.roomId ? `P${selectedBill.roomId}` : 'N/A';
  };

  // Tạo URL VietQR chuẩn
  const generateVietQR = (bill) => {
    const bankCode = landlordBank?.bankCode;
    const accountNumber = landlordBank?.accountNumber;

    if (!bankCode || !accountNumber) return null;

    const amount = getTotalAmount(bill);
    const roomCode = displayRoomName().replace(/\s+/g, '');
    const addInfo = encodeURIComponent(`HOADON ${bill.id} ${roomCode}`);
    const accountName = encodeURIComponent(landlordBank.accountHolder || '');

    return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light w-100 overflow-x-hidden">
      {/* CSS tùy chỉnh Responsive Margin & Sidebar */}
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
        `}
      </style>

      {/* Header Mobile - Chỉ hiện ở màn hình < 992px */}
      <header className="navbar navbar-dark bg-primary sticky-top px-3 shadow-sm d-lg-none d-print-none" style={{ zIndex: 1030, height: '56px' }}>
        <div className="d-flex align-items-center w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-link text-white p-0 border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
              <i className="bi bi-list fs-3"></i>
            </button>
            <span className="navbar-brand fw-bold mb-0 me-0 fs-6">HÓA ĐƠN</span>
          </div>
          <button className="btn btn-sm btn-light text-primary fw-semibold rounded-pill px-3" onClick={fetchBills}>
            <i className="bi bi-arrow-clockwise me-1"></i>Tải lại
          </button>
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
          {/* Action Bar trên Desktop */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3 d-none d-lg-inline-flex align-items-center" onClick={fetchBills}>
              <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted small">Đang tải hóa đơn...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 text-center p-4 p-md-5 bg-white">
              <i className="bi bi-receipt text-muted display-4 mb-3"></i>
              <h5 className="fw-bold text-secondary mb-2">Chưa Có Hóa Đơn Nào</h5>
              <p className="text-muted small mb-0">Bạn hiện chưa có hóa đơn trọ nào phát sinh trên hệ thống.</p>
            </div>
          ) : (
            <div className="row g-3 g-md-4">
              {/* CỘT TRÁI: DANH SÁCH HÓA ĐƠN */}
              <div className="col-12 col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                  <h6 className="fw-bold mb-3 px-1 text-secondary fs-6">LỊCH SỬ HÓA ĐƠN</h6>
                  <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '500px' }}>
                    {bills.map((bill) => {
                      const isSelected = selectedBill?.id === bill.id;
                      const isPaid = bill.status === 'PAID';

                      return (
                        <button
                          key={bill.id}
                          onClick={() => handleSelectBill(bill)}
                          className={`list-group-item list-group-item-action p-3 rounded-3 mb-2 border-0 transition-all ${
                            isSelected ? 'bg-primary text-white shadow-sm' : 'bg-light'
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className={`fw-bold ${isSelected ? 'text-white' : 'text-dark'}`}>
                              Tháng {bill.month}/{bill.year}
                            </span>
                            <span
                              className={`badge ${
                                isPaid ? 'bg-success' : isSelected ? 'bg-warning text-dark' : 'bg-danger'
                              }`}
                            >
                              {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center small">
                            <span className={isSelected ? 'text-white-50' : 'text-muted'}>
                              Mã HĐ: #{bill.id}
                            </span>
                            <span className={`fw-bold ${isSelected ? 'text-white' : 'text-primary'}`}>
                              {getTotalAmount(bill).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: CHI TIẾT HÓA ĐƠN & THANH TOÁN */}
              {selectedBill && (
                <div className="col-12 col-lg-7">
                  <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
                    {/* TIÊU ĐỀ CHI TIẾT */}
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 border-bottom pb-3 mb-3">
                      <div>
                        <h5 className="fw-bold text-primary mb-1 fs-5">
                          HÓA ĐƠN TIỀN TRỌ THÁNG {selectedBill.month}/{selectedBill.year}
                        </h5>
                        <span className="text-muted small">
                          Số phòng: <strong className="text-dark">{displayRoomName()}</strong>
                        </span>
                      </div>
                      <span className={`badge ${selectedBill.status === 'PAID' ? 'bg-success' : 'bg-danger'} px-3 py-2 fs-6 align-self-start align-self-sm-auto`}>
                        {selectedBill.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                      </span>
                    </div>

                    {/* BẢNG CHI TIẾT CÁC KHOẢN TIỀN */}
                    <div className="table-responsive mb-4">
                      <table className="table table-borderless align-middle mb-0 small">
                        <thead className="bg-light">
                          <tr className="text-muted small">
                            <th>KHOẢN MỤC</th>
                            <th className="text-center">CHI TIẾT</th>
                            <th className="text-end">THÀNH TIỀN</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="fw-semibold text-nowrap">🏠 Tiền phòng</td>
                            <td className="text-center text-muted">-</td>
                            <td className="text-end fw-bold">{getRoomFee(selectedBill).toLocaleString('vi-VN')} đ</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-nowrap">⚡ Tiền điện</td>
                            <td className="text-center text-muted small">
                              {selectedBill.electricityConsumption ? `${selectedBill.electricityConsumption} kWh` : '-'}
                            </td>
                            <td className="text-end fw-bold">{getElectricFee(selectedBill).toLocaleString('vi-VN')} đ</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-nowrap">💧 Tiền nước</td>
                            <td className="text-center text-muted small">
                              {selectedBill.waterConsumption ? `${selectedBill.waterConsumption} m³` : '-'}
                            </td>
                            <td className="text-end fw-bold">{getWaterFee(selectedBill).toLocaleString('vi-VN')} đ</td>
                          </tr>
                          {getOtherFee(selectedBill) > 0 && (
                            <tr>
                              <td className="fw-semibold text-nowrap">🧹 Dịch vụ khác</td>
                              <td className="text-center text-muted small">{selectedBill.otherServiceNote || 'Rác, Internet...'}</td>
                              <td className="text-end fw-bold">{getOtherFee(selectedBill).toLocaleString('vi-VN')} đ</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-top">
                            <td colSpan="2" className="fw-bold fs-6 text-dark">TỔNG CỘNG:</td>
                            <td className="text-end fw-bold fs-5 text-danger">
                              {getTotalAmount(selectedBill).toLocaleString('vi-VN')} VNĐ
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* KHU VỰC THANH TOÁN VIETQR */}
                    {selectedBill.status !== 'PAID' ? (
                      <div className="p-3 bg-light rounded-4 border text-center">
                        <h6 className="fw-bold text-dark mb-1 fs-6">QUÉT MÃ QR ĐỂ THANH TOÁN CHUYỂN KHOẢN</h6>
                        <p className="text-muted small mb-3">Sử dụng ứng dụng Ngân hàng/MoMo để quét mã bên dưới</p>

                        {landlordBank?.accountNumber && landlordBank?.bankCode ? (
                          <div className="row align-items-center justify-content-center g-3">
                            <div className="col-12 col-md-6 text-center">
                              <img
                                src={generateVietQR(selectedBill)}
                                alt="Mã QR Thanh Toán VietQR"
                                className="img-fluid rounded-3 border shadow-sm p-2 bg-white"
                                style={{ maxHeight: '220px', width: '100%', maxWidth: '220px' }}
                              />
                            </div>
                            <div className="col-12 col-md-6 text-start small">
                              <div className="mb-2">
                                <span className="text-muted d-block">Ngân hàng:</span>
                                <strong className="text-primary fs-6">{landlordBank.bankName || landlordBank.bankCode}</strong>
                              </div>
                              <div className="mb-2">
                                <span className="text-muted d-block">Số tài khoản:</span>
                                <strong className="fs-6 text-dark">{landlordBank.accountNumber}</strong>
                              </div>
                              <div className="mb-2">
                                <span className="text-muted d-block">Chủ tài khoản:</span>
                                <strong className="text-uppercase">{landlordBank.accountHolder}</strong>
                              </div>
                              <div>
                                <span className="text-muted d-block mb-1">Nội dung chuyển khoản:</span>
                                <code className="bg-white px-2 py-1 rounded border text-danger fw-bold text-break d-inline-block">
                                  HOADON {selectedBill.id} {displayRoomName().replace(/\s+/g, '')}
                                </code>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="alert alert-info m-0 small">
                            <i className="bi bi-info-circle me-1"></i> Chủ trọ chưa cấu hình thông tin ngân hàng cho hóa đơn này. Vui lòng liên hệ trực tiếp chủ trọ để thanh toán.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-success-subtle text-success rounded-4 text-center border border-success">
                        <i className="bi bi-check-circle-fill fs-3 d-block mb-1"></i>
                        <strong className="fs-6">Hóa đơn này đã được xác nhận thanh toán!</strong>
                        <p className="small mb-0 mt-1 text-muted">Cảm ơn bạn đã hoàn tất nghĩa vụ thanh toán đúng hạn.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}