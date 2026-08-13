import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function ManagerElectricityWater() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [motels, setMotels] = useState([]);
  const [selectedMotelId, setSelectedMotelId] = useState('');
  
  const [rooms, setRooms] = useState([]);
  const [elecWaterList, setElecWaterList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form nhập điện nước cho 1 phòng
  const [formData, setFormData] = useState({
    roomId: '',
    oldElectric: 0,
    newElectric: 0,
    electricPrice: 3500,
    oldWater: 0,
    newWater: 0,
    waterPrice: 15000
  });

  const [selectedEditItem, setSelectedEditItem] = useState(null);
  const userId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchMotels();
  }, []);

  useEffect(() => {
    if (selectedMotelId) {
      fetchData();
    }
  }, [selectedMotelId, selectedMonth, selectedYear]);

  // Lấy danh sách dãy trọ người quản lý phụ trách
  const fetchMotels = async () => {
    try {
      const res = await axiosClient.get(`/motels/managed-by/${userId}`).catch(() => 
        axiosClient.get(`/motels?userId=${userId}`)
      );
      const list = res.data || [];
      setMotels(list);
      if (list.length > 0) setSelectedMotelId(list[0].id);
    } catch (err) {
      console.error('Lỗi lấy danh sách dãy trọ:', err);
    }
  };

  // Lấy danh sách phòng & bản ghi điện nước tháng/năm đã chọn
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [resRooms, resElecWater] = await Promise.all([
        axiosClient.get(`/rooms?motelId=${selectedMotelId}`).catch(() => ({ data: [] })),
        axiosClient.get(`/electricity-water?motelId=${selectedMotelId}&month=${selectedMonth}&year=${selectedYear}`).catch(() => ({ data: [] }))
      ]);

      setRooms(resRooms.data || []);
      setElecWaterList(resElecWater.data || []);
    } catch (err) {
      setErrorMessage('Không thể tải dữ liệu chỉ số điện nước.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động map chỉ số điện/nước cũ khi chọn phòng
  const handleRoomSelect = (roomId) => {
    const selectedRoom = rooms.find(r => String(r.id) === String(roomId));
    if (!selectedRoom) return;

    // Tìm xem tháng này đã có chỉ số chưa
    const existing = elecWaterList.find(e => String(e.room?.id) === String(roomId));

    if (existing) {
      setFormData({
        roomId: roomId,
        oldElectric: existing.oldElectric || 0,
        newElectric: existing.newElectric || 0,
        electricPrice: existing.electricPrice || 3500,
        oldWater: existing.oldWater || 0,
        newWater: existing.newWater || 0,
        waterPrice: existing.waterPrice || 15000
      });
    } else {
      // Nếu chưa có, mặc định lấy chỉ số cũ là chỉ số mới của phòng (hoặc 0)
      setFormData({
        roomId: roomId,
        oldElectric: selectedRoom.lastElectric || 0,
        newElectric: selectedRoom.lastElectric || 0,
        electricPrice: 3500,
        oldWater: selectedRoom.lastWater || 0,
        newWater: selectedRoom.lastWater || 0,
        waterPrice: 15000
      });
    }
  };

  const handleSaveElectricityWater = async (e) => {
    e.preventDefault();
    if (!formData.roomId) {
      setErrorMessage('Vui lòng chọn phòng!');
      return;
    }

    if (Number(formData.newElectric) < Number(formData.oldElectric)) {
      setErrorMessage('Chỉ số điện mới không được nhỏ hơn chỉ số cũ!');
      return;
    }

    if (Number(formData.newWater) < Number(formData.oldWater)) {
      setErrorMessage('Chỉ số nước mới không được nhỏ hơn chỉ số cũ!');
      return;
    }

    setIsSubmitting(true);
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
      waterPrice: Number(formData.waterPrice)
    };

    try {
      await axiosClient.post('/electricity-water', payload);
      alert('Ghi chỉ số điện nước thành công!');
      fetchData();
      setFormData({
        roomId: '',
        oldElectric: 0,
        newElectric: 0,
        electricPrice: 3500,
        oldWater: 0,
        newWater: 0,
        waterPrice: 15000
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Lỗi khi lưu chỉ số điện nước!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount) => {
    return amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : '0 ₫';
  };

  // Tính lượng tiêu thụ & tiền
  const electricUsed = Math.max(0, formData.newElectric - formData.oldElectric);
  const waterUsed = Math.max(0, formData.newWater - formData.oldWater);
  const totalElectricFee = electricUsed * formData.electricPrice;
  const totalWaterFee = waterUsed * formData.waterPrice;

  return (
    <div className="d-flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính thụt lề 260px */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>

        {/* Header & Filter */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold mb-1">⚡ Quản Lý Điện Nước</h3>
            <p className="text-muted m-0">Ghi nhận chỉ số điện nước hàng tháng cho từng phòng trọ</p>
          </div>

          <div className="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm border">
            <select 
              className="form-select form-select-sm" 
              style={{ width: '160px' }}
              value={selectedMotelId} 
              onChange={e => setSelectedMotelId(e.target.value)}
            >
              {motels.map(m => (
                <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
              ))}
            </select>

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

        {/* Alert lỗi nếu có */}
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
          </div>
        )}

        {/* Form Ghi Chỉ Số Điện Nước */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold text-primary mb-3">
              📝 Ghi Chỉ Số Điện Nước (Tháng {selectedMonth}/{selectedYear})
            </h5>

            <form onSubmit={handleSaveElectricityWater}>
              <div className="row g-3">
                {/* Chọn Phòng */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Chọn Phòng (*)</label>
                  <select 
                    className="form-select"
                    required
                    value={formData.roomId}
                    onChange={e => {
                      setFormData({ ...formData, roomId: e.target.value });
                      handleRoomSelect(e.target.value);
                    }}
                  >
                    <option value="">-- Chọn Phòng --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.roomCode || r.roomNumber || r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Khối ĐIỆN */}
                <div className="col-12 col-md-4">
                  <div className="p-3 bg-light rounded border border-warning border-opacity-50">
                    <h6 className="fw-bold text-warning-emphasis mb-2">⚡ Chỉ Số Điện</h6>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small">Chỉ số cũ</label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={formData.oldElectric}
                          onChange={e => setFormData({ ...formData, oldElectric: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small">Chỉ số mới</label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={formData.newElectric}
                          onChange={e => setFormData({ ...formData, newElectric: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-12 mt-2">
                        <span className="small text-muted">
                          Tiêu thụ: <strong>{electricUsed} kWh</strong> | Thành tiền: <strong className="text-danger">{formatMoney(totalElectricFee)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Khối NƯỚC */}
                <div className="col-12 col-md-4">
                  <div className="p-3 bg-light rounded border border-info border-opacity-50">
                    <h6 className="fw-bold text-info-emphasis mb-2">💧 Chỉ Số Nước</h6>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small">Chỉ số cũ</label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={formData.oldWater}
                          onChange={e => setFormData({ ...formData, oldWater: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small">Chỉ số mới</label>
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          value={formData.newWater}
                          onChange={e => setFormData({ ...formData, newWater: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-12 mt-2">
                        <span className="small text-muted">
                          Tiêu thụ: <strong>{waterUsed} m³</strong> | Thành tiền: <strong className="text-primary">{formatMoney(totalWaterFee)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button type="submit" className="btn btn-primary fw-bold px-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang Lưu...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-1"></i> Lưu Chỉ Số
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bảng Danh Sách Điện Nước Tháng Chọn */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold m-0">
              📊 Danh Sách Điện Nước Tháng {selectedMonth}/{selectedYear}
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Phòng</th>
                    <th>Điện Cũ - Mới</th>
                    <th>Dùng (kWh)</th>
                    <th>Tiền Điện</th>
                    <th>Nước Cũ - Mới</th>
                    <th>Dùng (m³)</th>
                    <th>Tiền Nước</th>
                    <th>Tổng Tiền</th>
                    <th className="text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                      </td>
                    </tr>
                  ) : elecWaterList.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted">
                        Chưa có dữ liệu điện nước cho tháng này.
                      </td>
                    </tr>
                  ) : (
                    elecWaterList.map(item => {
                      const eUse = Math.max(0, (item.newElectric || 0) - (item.oldElectric || 0));
                      const wUse = Math.max(0, (item.newWater || 0) - (item.oldWater || 0));
                      const eFee = eUse * (item.electricPrice || 3500);
                      const wFee = wUse * (item.waterPrice || 15000);
                      const total = eFee + wFee;

                      return (
                        <tr key={item.id}>
                          <td className="fw-bold text-primary">
                            Phòng {item.room?.roomCode || item.room?.roomNumber || item.room?.name}
                          </td>
                          <td>{item.oldElectric} ➔ {item.newElectric}</td>
                          <td><span className="badge bg-warning text-dark">{eUse} kWh</span></td>
                          <td className="text-danger fw-semibold">{formatMoney(eFee)}</td>
                          <td>{item.oldWater} ➔ {item.newWater}</td>
                          <td><span className="badge bg-info text-dark">{wUse} m³</span></td>
                          <td className="text-primary fw-semibold">{formatMoney(wFee)}</td>
                          <td className="fw-bold text-success">{formatMoney(total)}</td>
                          <td className="text-center">
                            <button 
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => {
                                setFormData({
                                  roomId: item.room?.id,
                                  oldElectric: item.oldElectric,
                                  newElectric: item.newElectric,
                                  electricPrice: item.electricPrice || 3500,
                                  oldWater: item.oldWater,
                                  newWater: item.newWater,
                                  waterPrice: item.waterPrice || 15000
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              <i className="bi bi-pencil"></i> Sửa
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}