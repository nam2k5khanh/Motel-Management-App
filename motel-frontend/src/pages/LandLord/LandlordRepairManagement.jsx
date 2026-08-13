import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function RepairManagement() {
  const [requests, setRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Tải danh sách sự cố VÀ kết hợp lấy thông tin chi tiết từ bảng rooms & users
  const fetchData = async () => {
    setIsFetching(true);
    try {
      // 1. Lấy danh sách sự cố sửa chữa
      const res = await axiosClient.get('/repair-requests');
      const rawRequests = res.data || [];

      // 2. Lấy danh sách ID duy nhất để tránh gọi trùng lặp API
      const roomIds = [...new Set(rawRequests.map(item => item.roomId).filter(Boolean))];
      const tenantIds = [...new Set(rawRequests.map(item => item.tenantId).filter(Boolean))];

      const roomMap = {};
      const tenantMap = {};

      // 3. Gọi song song cả API lấy phòng và API lấy khách thuê (users)
      await Promise.all([
        // Lấy thông tin Rooms
        ...roomIds.map(async (id) => {
          try {
            const roomRes = await axiosClient.get(`/rooms/${id}`);
            roomMap[id] = roomRes.data;
          } catch (err) {
            console.error(`Không thể lấy thông tin phòng ID #${id}:`, err);
            roomMap[id] = null;
          }
        }),

        // Lấy thông tin Users (Khách thuê)
        ...tenantIds.map(async (id) => {
          try {
            const userRes = await axiosClient.get(`/users/${id}`);
            tenantMap[id] = userRes.data;
          } catch (err) {
            console.error(`Không thể lấy thông tin khách thuê ID #${id}:`, err);
            tenantMap[id] = null;
          }
        })
      ]);

      // 4. Ghép roomInfo và tenantInfo vào từng bản ghi repairRequest
      const mergedRequests = rawRequests.map(req => ({
        ...req,
        roomInfo: roomMap[req.roomId] || null,
        tenantInfo: tenantMap[req.tenantId] || null
      }));

      setRequests(mergedRequests);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu sự cố:', err);
      setRequests([]);
    } finally {
      setIsFetching(false);
    }
  };

  // Xử lý Cập nhật Trạng thái
  const handleStatusChange = async (id, newStatus) => {
    setProcessingId(id);
    try {
      await axiosClient.put(`/repair-requests/${id}/status`, { status: newStatus });
      setRequests(prev =>
        prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      alert('Thao tác thất bại: ' + (err.response?.data?.message || 'Có lỗi xảy ra!'));
    } finally {
      setProcessingId(null);
    }
  };

  // Thống kê nhanh
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const inProgressCount = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  // Lọc theo Tìm kiếm + Status + Priority (Tìm theo Tiêu đề, Mô tả, Phòng, Tên/SĐT Khách)
  const filteredRequests = requests.filter(item => {
    const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchPriority = selectedPriority === 'ALL' || item.priority === selectedPriority;
    
    const search = searchTerm.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const roomId = String(item.roomId || '');
    const roomName = (item.roomInfo?.roomCode || item.roomInfo?.roomNumber || item.roomInfo?.name || '').toLowerCase();
    
    // Lấy thông tin khách thuê
    const tenantName = (item.tenantInfo?.fullName || item.tenantInfo?.name || item.tenantInfo?.username || '').toLowerCase();
    const tenantPhone = (item.tenantInfo?.phone || item.tenantInfo?.phoneNumber || '').toLowerCase();

    const matchSearch =
      title.includes(search) ||
      desc.includes(search) ||
      roomId.includes(search) ||
      roomName.includes(search) ||
      tenantName.includes(search) ||
      tenantPhone.includes(search);

    return matchStatus && matchPriority && matchSearch;
  });

  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="badge bg-danger text-white px-2 py-1"><i className="bi bi-exclamation-triangle-fill me-1"></i>Cao</span>;
      case 'MEDIUM':
        return <span className="badge bg-warning text-dark px-2 py-1"><i className="bi bi-dash-circle-fill me-1"></i>Trung bình</span>;
      case 'LOW':
        return <span className="badge bg-secondary text-white px-2 py-1"><i className="bi bi-arrow-down-circle-fill me-1"></i>Thấp</span>;
      default:
        return <span className="badge bg-light text-dark">{priority}</span>;
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-2 py-1">⏳ Chờ xử lý</span>;
      case 'IN_PROGRESS':
        return <span className="badge bg-primary-subtle text-primary border border-primary px-2 py-1">⚙️ Đang xử lý</span>;
      case 'COMPLETED':
        return <span className="badge bg-success-subtle text-success border border-success px-2 py-1">✅ Hoàn thành</span>;
      case 'REJECTED':
        return <span className="badge bg-danger-subtle text-danger border border-danger px-2 py-1">❌ Từ chối</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">🛠️ Quản Lý & Tiếp Nhận Sự Cố Sửa Chữa</h3>

        {/* THỐNG KÊ NHANH */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white">
              <small className="text-muted fw-semibold">Tổng Số Sự Cố</small>
              <h3 className="fw-bold text-dark m-0 mt-1">{totalRequests}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white border-start border-warning border-4">
              <small className="text-warning fw-bold">Chờ Xử Lý</small>
              <h3 className="fw-bold text-warning m-0 mt-1">{pendingCount}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white border-start border-primary border-4">
              <small className="text-primary fw-bold">Đang Sửa Chữa</small>
              <h3 className="fw-bold text-primary m-0 mt-1">{inProgressCount}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm p-3 bg-white border-start border-success border-4">
              <small className="text-success fw-bold">Đã Hoàn Thành</small>
              <h3 className="fw-bold text-success m-0 mt-1">{completedCount}</h3>
            </div>
          </div>
        </div>

        {/* BẢNG HIỂN THỊ */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <div className="row align-items-center g-3">
              <div className="col-md-3">
                <h5 className="fw-bold m-0">Danh Sách Báo Cáo ({filteredRequests.length})</h5>
              </div>

              <div className="col-md-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold text-nowrap small text-muted">Trạng thái:</span>
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                  >
                    <option value="ALL">🌐 Tất cả trạng thái</option>
                    <option value="PENDING">⏳ Chờ xử lý</option>
                    <option value="IN_PROGRESS">⚙️ Đang xử lý</option>
                    <option value="COMPLETED">✅ Hoàn thành</option>
                    <option value="REJECTED">❌ Từ chối</option>
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold text-nowrap small text-muted">Ưu tiên:</span>
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value)}
                  >
                    <option value="ALL">🌐 Tất cả mức độ</option>
                    <option value="HIGH">🔴 Cao</option>
                    <option value="MEDIUM">🟡 Trung bình</option>
                    <option value="LOW">⚪ Thấp</option>
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="🔍 Tìm tiêu đề, phòng, tên khách, SĐT..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Phòng & Khách Thuê</th>
                    <th>Tiêu Đề & Nội Dung</th>
                    <th>Hình Ảnh</th>
                    <th>Độ Ưu Tiên</th>
                    <th>Trạng Thái</th>
                    <th className="text-center">Cập Nhật Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {isFetching ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status"></div>
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        Chưa có sự cố sửa chữa nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(item => {
                      const fullImageUrl = item.imageUrl
                        ? `http://localhost:8080${item.imageUrl}`
                        : null;

                      // Tên/Mã phòng từ object roomInfo
                      const displayRoomName = item.roomInfo 
                        ? (item.roomInfo.roomCode ? `Phòng ${item.roomInfo.roomCode}` : (item.roomInfo.roomNumber ? `Phòng ${item.roomInfo.roomNumber}` : item.roomInfo.name)) 
                        : `Phòng #${item.roomId}`;

                      // Thông tin người dùng từ object tenantInfo
                      const tenantName = item.tenantInfo
                        ? (item.tenantInfo.fullName || item.tenantInfo.name || item.tenantInfo.username)
                        : `Khách #${item.tenantId}`;

                      const tenantPhone = item.tenantInfo
                        ? (item.tenantInfo.phone || item.tenantInfo.phoneNumber)
                        : null;

                      return (
                        <tr key={item.id}>
                          {/* 1. THÔNG TIN PHÒNG & KHÁCH THUÊ */}
                          <td>
                            <div className="fw-bold text-primary mb-1">
                              <i className="bi bi-door-closed me-1"></i>
                              {displayRoomName}
                            </div>
                            <div className="small fw-semibold text-dark">
                              <i className="bi bi-person me-1"></i>
                              {tenantName}
                            </div>
                            {tenantPhone && (
                              <div className="small text-muted">
                                <i className="bi bi-telephone me-1"></i>
                                {tenantPhone}
                              </div>
                            )}
                          </td>

                          {/* 2. TIÊU ĐỀ & NỘI DUNG */}
                          <td style={{ maxWidth: '280px' }}>
                            <div className="fw-bold text-dark">{item.title}</div>
                            <div className="text-secondary small text-truncate">{item.description}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-clock me-1"></i>
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '---'}
                            </div>
                          </td>

                          {/* 3. HÌNH ẢNH */}
                          <td>
                            {fullImageUrl ? (
                              <img
                                src={fullImageUrl}
                                alt="Sự cố"
                                className="rounded border shadow-sm cursor-pointer"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => setPreviewImage(fullImageUrl)}
                              />
                            ) : (
                              <span className="text-muted small">Không có</span>
                            )}
                          </td>

                          {/* 4. ĐỘ ƯU TIÊN */}
                          <td>{renderPriorityBadge(item.priority)}</td>

                          {/* 5. TRẠNG THÁI */}
                          <td>{renderStatusBadge(item.status)}</td>

                          {/* 6. THAO TÁC CẬP NHẬT TRẠNG THÁI */}
                          <td className="text-center">
                            <select
                              className="form-select form-select-sm fw-semibold d-inline-block w-auto"
                              value={item.status}
                              disabled={processingId === item.id}
                              onChange={e => handleStatusChange(item.id, e.target.value)}
                            >
                              <option value="PENDING">⏳ Chờ xử lý</option>
                              <option value="IN_PROGRESS">⚙️ Đang xử lý</option>
                              <option value="COMPLETED">✅ Hoàn thành</option>
                              <option value="REJECTED">❌ Từ chối</option>
                            </select>
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

        {/* MODAL XEM ẢNH PHÓNG TO */}
        {previewImage && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setPreviewImage(null)}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">📷 Ảnh Chi Tiết Sự Cố</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setPreviewImage(null)}
                  ></button>
                </div>
                <div className="modal-body text-center p-2 bg-black rounded-bottom">
                  <img
                    src={previewImage}
                    alt="Phóng to"
                    className="img-fluid rounded"
                    style={{ maxHeight: '75vh', objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}