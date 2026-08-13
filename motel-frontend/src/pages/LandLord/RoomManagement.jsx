import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function RoomManagement() {
  const [motels, setMotels] = useState([]);
  const [selectedMotelId, setSelectedMotelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Form State - Khớp với các thuộc tính trong Entity Room.java
  const [formData, setFormData] = useState({
    roomCode: '',
    area: '',
    price: '',
    maxPeople: 2,
    status: 'EMPTY',
    description: ''
  });

  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const userId = Number(localStorage.getItem('userId')) || 1;

  useEffect(() => {
    fetchMotels();
  }, []);

  const fetchMotels = async () => {
    try {
      const res = await axiosClient.get(`/motels?userId=${userId}`);
      const motelList = res.data || [];
      setMotels(motelList);
      if (motelList.length > 0) {
        setSelectedMotelId(motelList[0].id);
        fetchRoomsByMotel(motelList[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách dãy trọ:', err);
    }
  };

  const fetchRoomsByMotel = async (motelId) => {
    if (!motelId) return;
    setIsFetching(true);
    try {
      const res = await axiosClient.get(`/rooms/motel/${motelId}`);
      setRooms(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách phòng:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleMotelChange = (e) => {
    const motelId = e.target.value;
    setSelectedMotelId(motelId);
    resetForm();
    fetchRoomsByMotel(motelId);
  };

  const resetForm = () => {
    setFormData({
      roomCode: '',
      area: '',
      price: '',
      maxPeople: 2,
      status: 'EMPTY',
      description: ''
    });
    setEditingRoomId(null);
    setErrorMessage('');
  };

  const handleEditClick = (room) => {
    setEditingRoomId(room.id);
    setFormData({
      roomCode: room.roomCode || '',
      area: room.area || '',
      price: room.price || '',
      maxPeople: room.maxPeople || 2,
      status: room.status || 'EMPTY',
      description: room.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMotelId) {
      alert('Vui lòng chọn dãy trọ!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (editingRoomId) {
        await axiosClient.put(`/rooms/${editingRoomId}`, formData);
        alert('Cập nhật phòng thành công!');
      } else {
        await axiosClient.post(`/rooms/motel/${selectedMotelId}`, formData);
        alert('Thêm phòng thành công!');
      }

      resetForm();
      fetchRoomsByMotel(selectedMotelId);
    } catch (err) {
      console.error('Lỗi khi lưu thông tin phòng:', err);
      setErrorMessage(err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (id, roomCode) => {
    if (window.confirm(`Bạn có chắc muốn xóa phòng ${roomCode}?`)) {
      try {
        await axiosClient.delete(`/rooms/${id}`);
        alert('Xóa phòng thành công!');
        fetchRoomsByMotel(selectedMotelId);
      } catch (err) {
        console.error('Lỗi xóa phòng:', err);
        alert('Xóa thất bại!');
      }
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'RENTED':
        return <span className="badge bg-danger">Đã thuê</span>;
      case 'MAINTENANCE':
        return <span className="badge bg-warning text-dark">Bảo trì</span>;
      default:
        return <span className="badge bg-success">Phòng trống</span>;
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filterStatus === 'ALL') return true;
    return room.status === filterStatus;
  });

  return (
    <div className="d-flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính thụt lề 260px khớp với Sidebar */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">🚪 Quản Lý Phòng Trọ</h3>

        {/* Dropdown Chọn Dãy Trọ */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body d-flex align-items-center">
            <label className="fw-bold me-3 text-nowrap fs-6">Chọn Dãy Trọ:</label>
            <select 
              className="form-select form-select-lg fw-semibold text-primary" 
              value={selectedMotelId} 
              onChange={handleMotelChange}
            >
              {motels.length === 0 ? (
                <option value="">Chưa có dãy trọ nào</option>
              ) : (
                motels.map(m => (
                  <option key={m.id} value={m.id}>🏢 {m.name} ({m.address})</option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Form Thêm/Sửa Phòng */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-primary">
                {editingRoomId ? '📝 Cập Nhật Phòng' : '➕ Thêm Phòng Mới'}
              </h5>
              {editingRoomId && (
                <button className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
                  <i className="bi bi-x-circle me-1"></i> Hủy chỉnh sửa
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
              <div className="col-md-3">
                <label className="form-label fw-semibold">Mã / Số Phòng (*)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: P101" 
                  required 
                  value={formData.roomCode} 
                  onChange={e => setFormData({ ...formData, roomCode: e.target.value })} 
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Giá Thuê (VNĐ) (*)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="VD: 2500000" 
                  required 
                  value={formData.price} 
                  onChange={e => setFormData({ ...formData, price: e.target.value })} 
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Diện Tích (m²)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-control" 
                  placeholder="VD: 25" 
                  value={formData.area} 
                  onChange={e => setFormData({ ...formData, area: e.target.value })} 
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Tối Đa (Người)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={formData.maxPeople} 
                  onChange={e => setFormData({ ...formData, maxPeople: e.target.value })} 
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Trạng Thái</label>
                <select 
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="EMPTY">Trống</option>
                  <option value="RENTED">Đã thuê</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Mô Tả / Ghi Chú</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ghi chú thêm về gác xép, nội thất, v.v." 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>

              <div className="col-12 text-end mt-3">
                {editingRoomId && (
                  <button type="button" className="btn btn-secondary me-2 px-3" onClick={resetForm}>
                    Hủy
                  </button>
                )}
                <button 
                  type="submit" 
                  className={`btn ${editingRoomId ? 'btn-warning' : 'btn-primary'} fw-bold px-4`}
                  disabled={isLoading || !selectedMotelId}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className={`bi ${editingRoomId ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                      {editingRoomId ? 'Lưu Cập Nhật' : 'Thêm Phòng'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danh Sách Phòng Trọ */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold m-0">Danh Sách Phòng ({filteredRooms.length}/{rooms.length})</h5>
          
          {/* Lọc phòng theo trạng thái */}
          <div className="btn-group btn-group-sm" role="group">
            <button 
              type="button" 
              className={`btn ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả
            </button>
            <button 
              type="button" 
              className={`btn ${filterStatus === 'EMPTY' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilterStatus('EMPTY')}
            >
              Trống
            </button>
            <button 
              type="button" 
              className={`btn ${filterStatus === 'RENTED' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilterStatus('RENTED')}
            >
              Đã thuê
            </button>
            <button 
              type="button" 
              className={`btn ${filterStatus === 'MAINTENANCE' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setFilterStatus('MAINTENANCE')}
            >
              Bảo trì
            </button>
          </div>
        </div>

        {isFetching ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="alert alert-info text-center">
            {rooms.length === 0 ? 'Dãy trọ này chưa có phòng nào.' : 'Không tìm thấy phòng phù hợp với bộ lọc.'}
          </div>
        ) : (
          <div className="row g-3">
            {filteredRooms.map(room => (
              <div className="col-md-4 col-lg-3" key={room.id}>
                <div className={`card h-100 border-0 shadow-sm ${editingRoomId === room.id ? 'border border-warning border-2' : ''}`}>
                  <div className="card-body d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="card-title fw-bold m-0 text-primary">{room.roomCode}</h5>
                        {renderStatusBadge(room.status)}
                      </div>
                      <p className="card-text text-danger fw-bold fs-5 mb-1">
                        {Number(room.price || 0).toLocaleString('vi-VN')} đ<small className="text-muted fs-6">/tháng</small>
                      </p>
                      <div className="small text-muted mb-2">
                        <span>📐 {room.area ? `${room.area} m²` : '---'}</span> | <span>👤 {room.maxPeople || 2} người</span>
                      </div>
                      {room.description && <p className="small text-secondary mb-2">{room.description}</p>}
                    </div>

                    <div className="d-flex justify-content-end gap-2 border-top pt-2 mt-2">
                      <button 
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleEditClick(room)}
                      >
                        <i className="bi bi-pencil"></i> Sửa
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteRoom(room.id, room.roomCode)}
                      >
                        <i className="bi bi-trash"></i> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}