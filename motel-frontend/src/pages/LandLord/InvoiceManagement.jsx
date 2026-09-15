import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function InvoiceManagement() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [motels, setMotels] = useState([]);
  const [selectedMotelId, setSelectedMotelId] = useState('');

  const [activeContracts, setActiveContracts] = useState([]); 
  const [elecWaterData, setElecWaterData] = useState([]); 
  const [invoices, setInvoices] = useState([]); 

  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form payload
  const [formData, setFormData] = useState({
    roomId: '',
    contractId: null,
    electricityWaterId: null,
    roomFee: 0,
    electricFee: 0,
    waterFee: 0,
    otherFee: 0
  });

  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);
  const userId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchMotels();
  }, []);

  useEffect(() => {
    if (selectedMotelId) {
      fetchInvoiceData();
    }
  }, [selectedMotelId, selectedMonth, selectedYear]);

  const fetchMotels = async () => {
    try {
      const res = await axiosClient.get(`/motels?userId=${userId}`);
      const list = res.data || [];
      setMotels(list);
      if (list.length > 0) setSelectedMotelId(list[0].id);
    } catch (err) {
      console.error('Lỗi lấy danh sách dãy trọ:', err);
    }
  };

  const fetchInvoiceData = async () => {
    setIsFetching(true);
    setErrorMessage('');
    try {
      const [resContracts, resElecWater, resInvoices] = await Promise.all([
        axiosClient.get(`/contracts/active/motel/${selectedMotelId}`).catch(() => 
          axiosClient.get(`/contracts/active-rooms/motel/${selectedMotelId}`)
        ).catch(() => ({ data: [] })),
        axiosClient.get(`/electricity-water?month=${selectedMonth}&year=${selectedYear}`).catch(() => ({ data: [] })),
        axiosClient.get(`/invoices?motelId=${selectedMotelId}&month=${selectedMonth}&year=${selectedYear}`).catch(() => ({ data: [] }))
      ]);

      setActiveContracts(resContracts.data || []);
      setElecWaterData(resElecWater.data || []);
      setInvoices(resInvoices.data || []);
    } catch (err) {
      setErrorMessage('Không thể tải dữ liệu hóa đơn.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    if (!roomId) {
      setFormData({ 
        roomId: '', 
        contractId: null, 
        electricityWaterId: null, 
        roomFee: 0, 
        electricFee: 0, 
        waterFee: 0, 
        otherFee: 0 
      });
      return;
    }

    const contractObj = activeContracts.find(c => 
      String(c.room?.id) === String(roomId) || String(c.id) === String(roomId)
    );
    
    const ew = elecWaterData.find(e => String(e.room?.id) === String(roomId));

    let eFee = 0;
    let wFee = 0;
    if (ew) {
      const eUsage = Math.max(0, (ew.newElectric || 0) - (ew.oldElectric || 0));
      const wUsage = Math.max(0, (ew.newWater || 0) - (ew.oldWater || 0));
      eFee = eUsage * (ew.electricPrice || 0);
      wFee = wUsage * (ew.waterPrice || 0);
    }

    const roomPrice = contractObj?.room?.price || contractObj?.price || contractObj?.roomPrice || 0;
    const contractId = contractObj?.id || contractObj?.contractId || null;
    const actualRoomId = contractObj?.room?.id || Number(roomId);

    setFormData({
      roomId: actualRoomId,
      contractId: contractId,
      electricityWaterId: ew?.id || null,
      roomFee: roomPrice,
      electricFee: eFee,
      waterFee: wFee,
      otherFee: 0
    });
  };

  const calcTotal = () => {
    return Number(formData.roomFee) + Number(formData.electricFee) + Number(formData.waterFee) + Number(formData.otherFee);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.roomId) {
      setErrorMessage('Vui lòng chọn phòng cần lập hóa đơn!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const payload = {
      roomId: Number(formData.roomId),
      contractId: formData.contractId ? Number(formData.contractId) : null,
      electricityWaterId: formData.electricityWaterId ? Number(formData.electricityWaterId) : null,
      month: Number(selectedMonth),
      year: Number(selectedYear),
      roomFee: Number(formData.roomFee),
      electricFee: Number(formData.electricFee),
      waterFee: Number(formData.waterFee),
      otherFee: Number(formData.otherFee),
      total: Number(calcTotal())
    };

    try {
      await axiosClient.post('/invoices', payload);
      alert('Tạo hóa đơn thành công!');
      setFormData({ roomId: '', contractId: null, electricityWaterId: null, roomFee: 0, electricFee: 0, waterFee: 0, otherFee: 0 });
      fetchInvoiceData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.response?.data || 'Có lỗi khi tạo hóa đơn!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      await axiosClient.patch(`/invoices/${id}/status?status=${newStatus}`);
      fetchInvoiceData();
    } catch (err) {
      alert('Không thể cập nhật trạng thái thanh toán!');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
      try {
        await axiosClient.delete(`/invoices/${id}`);
        fetchInvoiceData();
      } catch (err) {
        alert('Xóa thất bại!');
      }
    }
  };

  const formatMoney = (amount) => {
    return amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : '0 ₫';
  };

  const existingInvoiceRoomIds = invoices.map(i => i.room?.id);
  const availableRoomsToInvoice = activeContracts.filter(item => {
    const rId = item.room?.id || item.id;
    return !existingInvoiceRoomIds.includes(rId);
  });

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* 
        HEADER CHỈ HIỂN THỊ TRÊN MOBILE (Ẩn từ màn hình Desktop >= 992px nhờ d-lg-none)
      */}
      <header className="navbar navbar-dark bg-primary sticky-top px-3 shadow-sm d-lg-none" style={{ zIndex: 1030, height: '56px' }}>
        <div className="d-flex align-items-center w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-link text-white p-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
              <i className="bi bi-list fs-3"></i>
            </button>
            <span className="navbar-brand fw-bold mb-0 me-0 fs-5">CHỦ TRỌ</span>
          </div>
          <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            N
          </div>
        </div>
      </header>

      {/* Dynamic Style xử lý Responsive bọc lề Sidebar */}
      <style>{`
        .main-content-area {
          margin-left: 0 !important;
          width: 100% !important;
        }
        @media (min-width: 992px) {
          .main-content-area {
            margin-left: 260px !important;
            width: calc(100% - 260px) !important;
          }
        }
      `}</style>

      {/* Main Container Layout */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="main-content-area flex-grow-1 p-3 p-md-4">
          
          {/* Header Responsive */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 mb-md-4 gap-2">

            {/* Bộ lọc Dãy Trọ & Thời Gian */}
            <div className="d-flex flex-wrap gap-2 align-items-center bg-white p-2 rounded shadow-sm border">
              <select 
                className="form-select form-select-sm flex-fill" 
                style={{ minWidth: '130px' }}
                value={selectedMotelId} 
                onChange={e => setSelectedMotelId(e.target.value)}
              >
                {motels.map(m => (
                  <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
                ))}
              </select>

              <select 
                className="form-select form-select-sm" 
                style={{ width: '95px' }}
                value={selectedMonth} 
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>

              <select 
                className="form-select form-select-sm" 
                style={{ width: '90px' }}
                value={selectedYear} 
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* --- FORM THÊM / CẬP NHẬT --- */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3 p-md-4">
              <h5 className="fw-bold text-primary mb-3 fs-6 fs-md-5">
                ➕ Lập Hóa Đơn Mới (Tháng {selectedMonth}/{selectedYear})
              </h5>

              {errorMessage && (
                <div className="alert alert-danger py-2 mb-3 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleCreateInvoice}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Chọn Phòng (*)</label>
                    <select
                      className="form-select"
                      required
                      value={formData.roomId}
                      onChange={handleRoomChange}
                    >
                      <option value="">-- Chọn Phòng --</option>
                      {availableRoomsToInvoice.map(item => {
                        const roomId = item.room?.id || item.id;
                        const roomCode = item.room?.roomCode || item.roomCode || item.name;
                        return (
                          <option key={roomId} value={roomId}>Phòng {roomCode}</option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label fw-semibold small">Tiền Phòng</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.roomFee} 
                      onChange={e => setFormData({ ...formData, roomFee: Number(e.target.value) })} 
                    />
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label fw-semibold small">⚡ Tiền Điện</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.electricFee} 
                      onChange={e => setFormData({ ...formData, electricFee: Number(e.target.value) })} 
                    />
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label fw-semibold small">💧 Tiền Nước</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.waterFee} 
                      onChange={e => setFormData({ ...formData, waterFee: Number(e.target.value) })} 
                    />
                  </div>

                  <div className="col-6 col-md-2">
                    <label className="form-label fw-semibold small">🛠️ Chi Phí Khác</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.otherFee} 
                      onChange={e => setFormData({ ...formData, otherFee: Number(e.target.value) })} 
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="p-3 bg-light rounded border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                    <div>
                      <span className="fw-semibold">Thành Tiền: </span>
                      <strong className="text-success fs-5 ms-1">{formatMoney(calcTotal())}</strong>
                    </div>
                    <button type="submit" className="btn btn-primary fw-bold px-4 w-100 w-sm-auto" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-lg me-1"></i>
                          Tạo Hóa Đơn
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* --- BẢNG HIỂN THỊ DANH SÁCH --- */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold m-0 fs-6 fs-md-5">📊 Bảng Hóa Đơn Tháng {selectedMonth}/{selectedYear}</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-nowrap">
                  <thead className="table-dark">
                    <tr>
                      <th>Phòng</th>
                      <th>Tiền Phòng</th>
                      <th>Tiền Điện</th>
                      <th>Tiền Nước</th>
                      <th>Chi Phí Khác</th>
                      <th>Tổng Tiền</th>
                      <th>Trạng Thái</th>
                      <th className="text-center" style={{ width: '140px' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isFetching ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          Chưa có hóa đơn nào cho tháng này.
                        </td>
                      </tr>
                    ) : (
                      invoices.map(inv => (
                        <tr key={inv.id}>
                          <td className="fw-bold text-primary">
                            Phòng {inv.room?.roomCode || inv.room?.roomNumber || inv.room?.name}
                          </td>
                          <td>{formatMoney(inv.roomFee)}</td>
                          <td>{formatMoney(inv.electricFee)}</td>
                          <td>{formatMoney(inv.waterFee)}</td>
                          <td>{formatMoney(inv.otherFee)}</td>
                          <td className="fw-bold text-success">{formatMoney(inv.total)}</td>
                          <td>
                            <span 
                              className={`badge ${inv.status === 'PAID' ? 'bg-success' : 'bg-danger'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleToggleStatus(inv.id, inv.status)}
                            >
                              {inv.status === 'PAID' ? '✓ Đã Thanh Toán' : '⌛ Chưa Thanh Toán'}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
                              <button 
                                className="btn btn-sm btn-outline-info"
                                onClick={() => setSelectedInvoiceDetail(inv)}
                              >
                                <i className="bi bi-eye"></i> Xem
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteInvoice(inv.id)}
                              >
                                <i className="bi bi-trash"></i> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal Xem Hóa Đơn Chi Tiết */}
          {selectedInvoiceDetail && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      🧾 Hóa Đơn - Phòng {selectedInvoiceDetail.room?.roomCode || selectedInvoiceDetail.room?.roomNumber || selectedInvoiceDetail.room?.name}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setSelectedInvoiceDetail(null)}></button>
                  </div>
                  <div className="modal-body">
                    <p className="mb-1"><strong>Kỳ:</strong> Tháng {selectedInvoiceDetail.month}/{selectedInvoiceDetail.year}</p>
                    <p className="mb-3">
                      <strong>Trạng thái: </strong> 
                      {selectedInvoiceDetail.status === 'PAID' ? (
                        <span className="text-success fw-bold">Đã thanh toán</span>
                      ) : (
                        <span className="text-danger fw-bold">Chưa thanh toán</span>
                      )}
                    </p>
                    <hr />
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tiền phòng:</span>
                      <strong>{formatMoney(selectedInvoiceDetail.roomFee)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tiền điện:</span>
                      <strong>{formatMoney(selectedInvoiceDetail.electricFee)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tiền nước:</span>
                      <strong>{formatMoney(selectedInvoiceDetail.waterFee)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Chi phí khác:</span>
                      <strong>{formatMoney(selectedInvoiceDetail.otherFee)}</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between fs-5 fw-bold text-success">
                      <span>TỔNG TIỀN:</span>
                      <span>{formatMoney(selectedInvoiceDetail.total)}</span>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setSelectedInvoiceDetail(null)}>
                      Đóng
                    </button>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                      In Hóa Đơn
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}