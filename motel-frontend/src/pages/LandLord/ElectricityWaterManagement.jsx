import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function ElectricityWaterManagement() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // State quản lý danh sách Dãy trọ & Phòng trọ
  const [motels, setMotels] = useState([]);           // Danh sách dãy trọ
  const [selectedMotelId, setSelectedMotelId] = useState(''); // ID dãy trọ đang chọn
  const [rooms, setRooms] = useState([]);             // Danh sách phòng thuộc dãy trọ đã chọn

  const [records, setRecords] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lấy userId từ localStorage
  const userId = localStorage.getItem('userId') || '1';

  // Form state khớp DTO Backend
  const [formData, setFormData] = useState({
    roomId: '',
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    oldElectric: 0,
    newElectric: 0,
    electricPrice: 3500,
    oldWater: 0,
    newWater: 0,
    waterPrice: 15000,
  });

  const [editingId, setEditingId] = useState(null);

  // 1. Tải danh sách Dãy trọ (Motels) & Chỉ số điện nước theo kỳ
  useEffect(() => {
    fetchInitialData();
  }, [selectedMonth, selectedYear]);

  // 2. Mỗi khi chọn Dãy trọ (Motel) khác -> Gọi API lấy phòng của Dãy trọ đó
  useEffect(() => {
    if (selectedMotelId) {
      fetchRoomsByMotel(selectedMotelId);
    } else {
      setRooms([]);
    }
  }, [selectedMotelId]);

  const fetchInitialData = async () => {
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

      // Mặc định chọn Dãy trọ đầu tiên nếu chưa chọn
      if (motelList.length > 0 && !selectedMotelId) {
        setSelectedMotelId(motelList[0].id);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setErrorMessage('Không thể kết nối đến máy chủ.');
    } finally {
      setIsFetching(false);
    }
  };

  // Gọi API lấy danh sách phòng đang có hợp đồng hoạt động
  const fetchRoomsByMotel = async (motelId) => {
    try {
      const res = await axiosClient.get(`/contracts/active-rooms/motel/${motelId}`);
      setRooms(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách phòng đang thuê:', err);
      setRooms([]);
    }
  };

  // Tính toán điện nước hiển thị trực tiếp
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
    setFormData(prev => ({ ...prev, roomId: '' })); // Reset phòng được chọn
  };

  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const selectedRoom = rooms.find(r => String(r.id) === String(roomId));

    setFormData(prev => ({
      ...prev,
      roomId: roomId,
      electricPrice: selectedRoom?.electricPrice || prev.electricPrice,
      waterPrice: selectedRoom?.waterPrice || prev.waterPrice,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      roomId: '',
      month: selectedMonth,
      year: selectedYear,
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

    // Lấy motelId từ đối tượng Room
    const itemMotelId = item.room?.motel?.id || item.room?.motelId;

    if (itemMotelId) {
      setSelectedMotelId(itemMotelId);
      await fetchRoomsByMotel(itemMotelId);
    }

    setFormData({
      roomId: item.room?.id || '',
      month: item.month || selectedMonth,
      year: item.year || selectedYear,
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

    setIsLoading(true);
    setErrorMessage('');

    const payload = {
      roomId: Number(formData.roomId),
      month: Number(formData.month),
      year: Number(formData.year),
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
        alert('Cập nhật chỉ số thành công!');
      } else {
        await axiosClient.post('/electricity-water', payload);
        alert('Ghi nhận chỉ số thành công!');
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
    if (window.confirm('Bạn có chắc muốn xóa chỉ số điện nước này?')) {
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
    <div className="d-flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính thụt lề 260px khớp với Sidebar */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold mb-1">⚡💧 Quản Lý Chỉ Số Điện Nước</h3>
            <p className="text-muted m-0">Chọn dãy trọ để quản lý chỉ số điện nước từng phòng</p>
          </div>

          <div className="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm border">
            <span className="fw-semibold ms-2">Kỳ ghi chép:</span>
            <select 
              className="form-select form-select-sm" 
              style={{ width: '110px' }}
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>

            <select 
              className="form-select form-select-sm" 
              style={{ width: '100px' }}
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Form nhập dữ liệu */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-primary m-0">
                {editingId ? '📝 Cập Nhật Chỉ Số' : '➕ Nhập Chỉ Số Điện Nước Mới'}
              </h5>
              {editingId && (
                <button className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
                  <i className="bi bi-x-circle me-1"></i> Hủy sửa
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="row g-3">
              
              {/* 1. CHỌN DÃY TRỌ */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">1. Chọn Dãy Trọ (*)</label>
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

              {/* 2. CHỌN PHÒNG THEO DÃY TRỌ */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">2. Chọn Phòng Trọ (*)</label>
                <select
                  className="form-select"
                  required
                  value={formData.roomId}
                  onChange={handleRoomChange}
                  disabled={!selectedMotelId || rooms.length === 0}
                >
                  <option value="">
                    {!selectedMotelId 
                      ? '-- Hãy chọn dãy trọ trước --' 
                      : rooms.length === 0 
                        ? '-- Không có phòng nào đang có hợp đồng --' 
                        : '-- Chọn Phòng (Đã có hợp đồng) --'}
                  </option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.roomCode || r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Đơn Giá Điện (VNĐ/kWh)</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.electricPrice}
                  onChange={e => setFormData({ ...formData, electricPrice: Number(e.target.value) })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Đơn Giá Nước (VNĐ/m³)</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.waterPrice}
                  onChange={e => setFormData({ ...formData, waterPrice: Number(e.target.value) })}
                />
              </div>

              {/* Nhóm Điện */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">⚡ Điện Cũ</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.oldElectric}
                  onChange={e => setFormData({ ...formData, oldElectric: Number(e.target.value) })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">⚡ Điện Mới</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.newElectric}
                  onChange={e => setFormData({ ...formData, newElectric: Number(e.target.value) })}
                />
              </div>

              {/* Nhóm Nước */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">💧 Nước Cũ</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.oldWater}
                  onChange={e => setFormData({ ...formData, oldWater: Number(e.target.value) })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">💧 Nước Mới</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.newWater}
                  onChange={e => setFormData({ ...formData, newWater: Number(e.target.value) })}
                />
              </div>

              {/* Khối xem trước tiền */}
              <div className="col-12">
                <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-4">
                    <span>⚡ Điện sử dụng: <strong className="text-danger">{calcElectricUsage()} kWh</strong></span>
                    <span>💧 Nước sử dụng: <strong className="text-primary">{calcWaterUsage()} m³</strong></span>
                  </div>
                  <div className="fs-5 fw-bold text-success">
                    Tổng Tiền: {formatMoney(calcTotal())}
                  </div>
                </div>
              </div>

              <div className="col-12 text-end">
                {editingId && (
                  <button type="button" className="btn btn-secondary me-2 px-3" onClick={resetForm}>
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className={`btn ${editingId ? 'btn-warning' : 'btn-primary'} fw-bold px-4`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <i className={`bi ${editingId ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                      {editingId ? 'Lưu Thay Đổi' : 'Ghi Nhận Chỉ Số'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bảng Danh Sách */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h5 className="fw-bold m-0">📊 Bảng Tổng Hợp Điện Nước Tháng {selectedMonth}/{selectedYear}</h5>
          </div>
          <div className="card-body p-0">
            {isFetching ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Dãy Trọ</th>
                      <th>Phòng</th>
                      <th>Chỉ Số Điện</th>
                      <th>⚡ Điện Dùng</th>
                      <th>Chỉ Số Nước</th>
                      <th>💧 Nước Dùng</th>
                      <th>Tổng Tiền</th>
                      <th className="text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          Chưa có chỉ số điện nước trong Tháng {selectedMonth}/{selectedYear}.
                        </td>
                      </tr>
                    ) : (
                      records.map(item => {
                        const elecUsage = (item.newElectric || 0) - (item.oldElectric || 0);
                        const waterUsage = (item.newWater || 0) - (item.oldWater || 0);

                        return (
                          <tr key={item.id} className={editingId === item.id ? 'table-warning' : ''}>
                            <td className="fw-semibold text-secondary">
                              {item.room?.motel?.name || '---'}
                            </td>
                            <td className="fw-bold text-primary">
                              Phòng {item.room?.roomCode || item.room?.name || '---'}
                            </td>
                            <td>{item.oldElectric} ➔ {item.newElectric}</td>
                            <td className="fw-bold text-danger">+{elecUsage} kWh</td>
                            <td>{item.oldWater} ➔ {item.newWater}</td>
                            <td className="fw-bold text-primary">+{waterUsage} m³</td>
                            <td className="fw-bold text-success">{formatMoney(item.total)}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-warning me-2"
                                onClick={() => handleEditClick(item)}
                              >
                                <i className="bi bi-pencil"></i> Sửa
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item.id)}
                              >
                                <i className="bi bi-trash"></i> Xóa
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
  );
}