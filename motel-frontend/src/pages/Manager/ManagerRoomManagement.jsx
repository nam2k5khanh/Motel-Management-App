import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function ManagerRoomManagement() {
  const [motels, setMotels] = useState([]);
  const [selectedMotelId, setSelectedMotelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const userId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchMotels();
  }, []);

  useEffect(() => {
    if (selectedMotelId) {
      fetchRooms();
    }
  }, [selectedMotelId]);

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

  const fetchRooms = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await axiosClient.get(`/rooms?motelId=${selectedMotelId}`);
      setRooms(res.data || []);
    } catch (err) {
      setErrorMessage('Không thể lấy danh sách phòng.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : '0 ₫';
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold mb-1">🏠 Quản Lý Phòng Trọ</h3>
            <p className="text-muted m-0">Theo dõi danh sách phòng và trạng thái thuê</p>
          </div>

          <div className="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm border">
            <label className="fw-semibold me-1 small">Dãy trọ:</label>
            <select 
              className="form-select form-select-sm" 
              style={{ width: '180px' }}
              value={selectedMotelId} 
              onChange={e => setSelectedMotelId(e.target.value)}
            >
              {motels.map(m => (
                <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert-danger py-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
          </div>
        )}

        {/* Danh sách phòng dạng Lưới Card */}
        <div className="row g-3">
          {isLoading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
              Dãy trọ này chưa có phòng nào.
            </div>
          ) : (
            rooms.map(room => {
              const isOccupied = room.status === 'RENTED' || room.status === 'OCCUPIED' || room.isOccupied;
              return (
                <div key={room.id} className="col-12 col-sm-6 col-md-4 col-xl-3">
                  <div className={`card border-0 shadow-sm h-100 border-top border-4 ${isOccupied ? 'border-danger' : 'border-success'}`}>
                    <div className="card-body d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="fw-bold m-0 text-primary">
                            Phòng {room.roomCode || room.roomNumber || room.name}
                          </h5>
                          <span className={`badge ${isOccupied ? 'bg-danger' : 'bg-success'}`}>
                            {isOccupied ? 'Đã Thuê' : 'Còn Trống'}
                          </span>
                        </div>
                        <p className="text-muted small mb-2">
                          <i className="bi bi-tag me-1"></i>
                          Giá: <strong className="text-dark">{formatMoney(room.price)}</strong>
                        </p>
                        <p className="text-muted small mb-0">
                          <i className="bi bi-layers me-1"></i>
                          Tầng: {room.floor || 1}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-top">
                        <button 
                          className="btn btn-sm btn-outline-primary w-100"
                          onClick={() => setSelectedRoomDetail(room)}
                        >
                          <i className="bi bi-info-circle me-1"></i> Chi Tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Chi Tiết Phòng */}
        {selectedRoomDetail && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    🏠 Chi Tiết Phòng {selectedRoomDetail.roomCode || selectedRoomDetail.roomNumber || selectedRoomDetail.name}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedRoomDetail(null)}></button>
                </div>
                <div className="modal-body">
                  <p><strong>Giá phòng:</strong> {formatMoney(selectedRoomDetail.price)}</p>
                  <p><strong>Tầng:</strong> {selectedRoomDetail.floor || 1}</p>
                  <p>
                    <strong>Trạng thái: </strong> 
                    <span className={`badge ${selectedRoomDetail.status === 'RENTED' || selectedRoomDetail.isOccupied ? 'bg-danger' : 'bg-success'}`}>
                      {selectedRoomDetail.status === 'RENTED' || selectedRoomDetail.isOccupied ? 'Đã Cho Thuê' : 'Còn Trống'}
                    </span>
                  </p>
                  {selectedRoomDetail.description && (
                    <p><strong>Mô tả:</strong> {selectedRoomDetail.description}</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setSelectedRoomDetail(null)}>Đóng</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}