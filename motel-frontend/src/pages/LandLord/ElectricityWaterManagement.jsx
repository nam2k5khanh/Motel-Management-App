import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function ElectricityWaterManagement() {
  const currentDate = new Date();
  
  // State lọc kỳ làm việc
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // State danh mục
  const [motels, setMotels] = useState([]);
  const [selectedMotelId, setSelectedMotelId] = useState('');
  const [rooms, setRooms] = useState([]);
  
  // State bảng dữ liệu
  const [records, setRecords] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const userId = localStorage.getItem('userId') || '1';
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    roomId: '',
    oldElectric: 0,
    newElectric: 0,
    electricPrice: 3500,
    oldWater: 0,
    newWater: 0,
    waterPrice: 15000,
  });

  const fetchInitialData = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage('');
    try {
      const [resMotels, resRecords] = await Promise.all([
        axiosClient.get(`/motels?userId=${userId}`).catch(() => ({ data: [] })),
        axiosClient.get(`/electricity-water?month=${selectedMonth}&year=${selectedYear}`).catch(() => ({ data: [] }))
      ]);

      const motelList = resMotels.data || [];
      setMotels(motelList);
      setRecords(resRecords.data || []);

      if (motelList.length > 0 && !selectedMotelId) {
        setSelectedMotelId(motelList[0].id);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setErrorMessage('Không thể kết nối đến máy chủ.');
    } finally {
      setIsFetching(false);
    }
  }, [userId, selectedMonth, selectedYear, selectedMotelId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchRoomsByMotel = async (motelId) => {
    try {
      const res = await axiosClient.get(`/contracts/active-rooms/motel/${motelId}`);
      const roomList = res.data || [];
      setRooms(roomList);
      return roomList;
    } catch (err) {
      console.error('Lỗi tải danh sách phòng:', err);
      setRooms([]);
      return [];
    }
  };

  useEffect(() => {
    if (selectedMotelId) {
      fetchRoomsByMotel(selectedMotelId);
    } else {
      setRooms([]);
    }
  }, [selectedMotelId]);

  const calcElectricUsage = () => Math.max(0, (formData.newElectric || 0) - (formData.oldElectric || 0));
  const calcWaterUsage = () => Math.max(0, (formData.newWater || 0) - (formData.oldWater || 0));
  
  const calcTotal = () => {
    const electricCost = calcElectricUsage() * (formData.electricPrice || 0);
    const waterCost = calcWaterUsage() * (formData.waterPrice || 0);
    return electricCost + waterCost;
  };

  const handleMotelChange = (e) => {
    const motelId = e.target.value;
    setSelectedMotelId(motelId);
    setFormData(prev => ({ ...prev, roomId: '' }));
  };

  const handleRoomChange = async (e) => {
    const roomId = e.target.value;
    const selectedRoom = rooms.find(r => String(r.id) === String(roomId));

    let autoOldElectric = 0;
    let autoOldWater = 0;

    if (roomId && !editingId) {
      try {
        const prevRes = await axiosClient.get(`/electricity-water/latest-record?roomId=${roomId}`);
        if (prevRes.data) {
          autoOldElectric = prevRes.data.newElectric || 0;
          autoOldWater = prevRes.data.newWater || 0;
        }
      } catch (err) {
        // Mặc định 0 nếu không tìm thấy
      }
    }

    setFormData(prev => ({
      ...prev,
      roomId: roomId,
      oldElectric: autoOldElectric,
      newElectric: autoOldElectric,
      oldWater: autoOldWater,
      newWater: autoOldWater,
      electricPrice: selectedRoom?.electricPrice || prev.electricPrice,
      waterPrice: selectedRoom?.waterPrice || prev.waterPrice,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      roomId: '',
      oldElectric: 0,
      newElectric: 0,
      electricPrice: 3500,
      oldWater: 0,
      newWater: 0,
      waterPrice: 15000,
    });
    setErrorMessage('');
  };

  const handleEditClick = async (item) => {
    setEditingId(item.id);
    const itemMotelId = item.room?.motel?.id || item.room?.motelId;

    if (itemMotelId) {
      setSelectedMotelId(itemMotelId);
      await fetchRoomsByMotel(itemMotelId);
    }

    setFormData({
      roomId: item.room?.id || '',
      oldElectric: item.oldElectric || 0,
      newElectric: item.newElectric || 0,
      electricPrice: item.electricPrice || 3500,
      oldWater: item.oldWater || 0,
      newWater: item.newWater || 0,
      waterPrice: item.waterPrice || 15000,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomId) {
      setErrorMessage('Vui lòng chọn phòng trọ!');
      return;
    }

    if (formData.newElectric < formData.oldElectric) {
      setErrorMessage('Chỉ số điện mới không thể nhỏ hơn chỉ số điện cũ!');
      return;
    }

    if (formData.newWater < formData.oldWater) {
      setErrorMessage('Chỉ số nước mới không thể nhỏ hơn chỉ số nước cũ!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const payload = {
      roomId: Number(formData.roomId),
      month: Number(selectedMonth),
      year: Number(selectedYear),
      oldElectric: Number(formData.oldElectric),
      newElectric: Number(formData.newElectric),
      electricPrice: Number(formData.electricPrice),
      oldWater: Number(formData.oldWater),
      newWater: Number(formData.newWater),
      waterPrice: Number(formData.waterPrice),
      total: calcTotal()
    };

    try {
      if (editingId) {
        await axiosClient.put(`/electricity-water/${editingId}`, payload);
      } else {
        await axiosClient.post('/electricity-water', payload);
      }
      resetForm();
      fetchInitialData();
    } catch (err) {
      console.error('Lỗi khi lưu chỉ số:', err);
      setErrorMessage(err.response?.data?.message || 'Có lỗi xảy ra khi lưu chỉ số!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa bản ghi chỉ số này?')) {
      try {
        await axiosClient.delete(`/electricity-water/${id}`);
        fetchInitialData();
      } catch (err) {
        alert('Xóa thất bại!');
      }
    }
  };

  const formatMoney = (amount) => {
    return amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : '0 ₫';
  };

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

      {/* Dynamic Style xử lý Responsive lề Sidebar trên Desktop */}
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
          
          {/* Header & Month/Year Selector */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 mb-md-4 gap-2">
            <div className="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm border">
              <span className="fw-semibold small text-nowrap">Kỳ làm việc:</span>
              <select 
                className="form-select form-select-sm" 
                style={{ width: '105px' }}
                value={selectedMonth} 
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>

              <select 
                className="form-select form-select-sm" 
                style={{ width: '95px' }}
                value={selectedYear} 
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Record Input */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-primary m-0 fs-6 fs-md-5">
                  {editingId ? '📝 Cập Nhật Chỉ Số' : `➕ Nhập Chỉ Số Mới - Tháng ${selectedMonth}/${selectedYear}`}
                </h5>
                {editingId && (
                  <button className="btn btn-sm btn-outline-secondary py-0" onClick={resetForm}>
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>

              {errorMessage && (
                <div className="alert alert-danger py-2 mb-3 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12 col-md-6 col-xl-3">
                  <label className="form-label fw-semibold small">1. Dãy Trọ (*)</label>
                  <select
                    className="form-select"
                    value={selectedMotelId}
                    onChange={handleMotelChange}
                    required
                  >
                    <option value="">-- Chọn Dãy Trọ --</option>
                    {motels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name || `Dãy Trọ #${m.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <label className="form-label fw-semibold small">2. Phòng Trọ (*)</label>
                  <select
                    className="form-select"
                    required
                    value={formData.roomId}
                    onChange={handleRoomChange}
                    disabled={!selectedMotelId || rooms.length === 0}
                  >
                    <option value="">
                      {!selectedMotelId 
                        ? '-- Chọn dãy trọ trước --' 
                        : rooms.length === 0 
                          ? '-- Không có phòng thuê --' 
                          : '-- Chọn Phòng --'}
                    </option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.roomCode || r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-xl-3">
                  <label className="form-label fw-semibold small">Đơn Giá Điện (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.electricPrice}
                    onChange={e => setFormData({ ...formData, electricPrice: Number(e.target.value) })}
                  />
                </div>

                <div className="col-6 col-xl-3">
                  <label className="form-label fw-semibold small">Đơn Giá Nước (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.waterPrice}
                    onChange={e => setFormData({ ...formData, waterPrice: Number(e.target.value) })}
                  />
                </div>

                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold small">⚡ Điện Cũ</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.oldElectric}
                    onChange={e => setFormData({ ...formData, oldElectric: Number(e.target.value) })}
                  />
                </div>

                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold small">⚡ Điện Mới</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.newElectric}
                    onChange={e => setFormData({ ...formData, newElectric: Number(e.target.value) })}
                  />
                </div>

                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold small">💧 Nước Cũ</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.oldWater}
                    onChange={e => setFormData({ ...formData, oldWater: Number(e.target.value) })}
                  />
                </div>

                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold small">💧 Nước Mới</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.newWater}
                    onChange={e => setFormData({ ...formData, newWater: Number(e.target.value) })}
                  />
                </div>

                {/* Calculation Summary Bar */}
                <div className="col-12 mt-3">
                  <div className="p-3 bg-light rounded border d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                    <div className="d-flex gap-3">
                      <span>⚡ Dùng: <strong className="text-danger">{calcElectricUsage()} kWh</strong></span>
                      <span>💧 Dùng: <strong className="text-primary">{calcWaterUsage()} m³</strong></span>
                    </div>
                    <div className="fw-bold text-success fs-5">
                      Thành Tiền: {formatMoney(calcTotal())}
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-3">
                  <button
                    type="submit"
                    className={`btn ${editingId ? 'btn-warning' : 'btn-primary'} fw-bold w-100 py-2`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang lưu...' : editingId ? 'Lưu Thay Đổi' : '+ Ghi Nhận Chỉ Số'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Records Table */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold m-0 fs-6 fs-md-5">📊 Bảng Chỉ Số Tháng {selectedMonth}/{selectedYear}</h5>
            </div>
            <div className="card-body p-0">
              {isFetching ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 text-nowrap">
                    <thead className="table-dark">
                      <tr>
                        <th>Dãy Trọ</th>
                        <th>Phòng</th>
                        <th>Điện (Cũ ➔ Mới)</th>
                        <th>⚡ Tiêu Thụ</th>
                        <th>Nước (Cũ ➔ Mới)</th>
                        <th>💧 Tiêu Thụ</th>
                        <th>Tổng Tiền</th>
                        <th className="text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">
                            Chưa có dữ liệu chỉ số điện nước trong tháng này.
                          </td>
                        </tr>
                      ) : (
                        records.map(item => {
                          const elecUsage = (item.newElectric || 0) - (item.oldElectric || 0);
                          const waterUsage = (item.newWater || 0) - (item.oldWater || 0);

                          return (
                            <tr key={item.id} className={editingId === item.id ? 'table-warning' : ''}>
                              <td>{item.room?.motel?.name || '---'}</td>
                              <td className="fw-bold text-primary">Phòng {item.room?.roomCode || item.room?.name || '---'}</td>
                              <td>{item.oldElectric} ➔ {item.newElectric}</td>
                              <td className="fw-bold text-danger">+{elecUsage} kWh</td>
                              <td>{item.oldWater} ➔ {item.newWater}</td>
                              <td className="fw-bold text-primary">+{waterUsage} m³</td>
                              <td className="fw-bold text-success">{formatMoney(item.total)}</td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-outline-warning me-1 px-2 py-1"
                                  onClick={() => handleEditClick(item)}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger px-2 py-1"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}