import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  
  // State quản lý Dãy trọ, Phòng trọ & Khách thuê
  const [motels, setMotels] = useState([]);
  const [selectedMotelId, setSelectedMotelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  
  // State quản lý tên Chủ sở hữu (Bên A)
  const [ownerName, setOwnerName] = useState('Ban Quản Lý Dãy Trọ');

  // Loading State
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);
  const [isFetchingTenants, setIsFetchingTenants] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    tenantId: '',
    roomId: '',
    startDate: '',
    endDate: '',
    deposit: '',
    rentPrice: '',
    status: 'ACTIVE'
  });

  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal Detail State
  const [selectedContract, setSelectedContract] = useState(null);

  const userId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    fetchOwnerName();
    fetchInitialData();
  }, []);

  // Lấy tên Chủ sở hữu từ API dựa theo userId trong localStorage
  const fetchOwnerName = async () => {
    if (!userId) return;
    try {
      let userData = null;
      try {
        const res = await axiosClient.get(`/users/${userId}`);
        userData = res.data;
      } catch (err1) {
        try {
          const res = await axiosClient.get(`/api/users/${userId}`);
          userData = res.data;
        } catch (err2) {
          console.error(`Không thể lấy thông tin Chủ sở hữu ID #${userId}:`, err2);
        }
      }

      if (userData) {
        const name = userData.fullName || userData.name || userData.username || 'Ban Quản Lý Dãy Trọ';
        setOwnerName(name);
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin chủ sở hữu:', err);
    }
  };

  const fetchInitialData = async () => {
    setIsFetching(true);
    setErrorMessage('');
    try {
      const [resContracts, resMotels] = await Promise.allSettled([
        axiosClient.get('/contracts'),
        axiosClient.get(`/motels?userId=${userId}`)
      ]);

      if (resContracts.status === 'fulfilled') setContracts(resContracts.value.data || []);
      
      if (resMotels.status === 'fulfilled') {
        setMotels(resMotels.value.data || []);
      } else {
        console.error('Lỗi lấy danh sách dãy trọ:', resMotels.reason);
        setErrorMessage('Không thể tải danh sách dãy trọ.');
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
      setErrorMessage('Không thể tải dữ liệu từ máy chủ.');
    } finally {
      setIsFetching(false);
    }
  };

  // Tải danh sách phòng theo motelId
  const fetchRoomsByMotel = async (motelId) => {
    if (!motelId) {
      setRooms([]);
      return [];
    }
    setIsFetchingRooms(true);
    try {
      const res = await axiosClient.get(`/rooms/motel/${motelId}`);
      const roomData = res.data || [];
      setRooms(roomData);
      return roomData;
    } catch (err) {
      console.error('Lỗi tải danh sách phòng:', err);
      setRooms([]);
      return [];
    } finally {
      setIsFetchingRooms(false);
    }
  };

  // Tải danh sách khách thuê theo motelId VÀ gọi API /users/{userId} để lấy Tên
  const fetchTenantsByMotel = async (motelId) => {
    if (!motelId) {
      setTenants([]);
      return [];
    }
    setIsFetchingTenants(true);
    try {
      // 1. Gọi API lấy quan hệ motel-tenants
      const res = await axiosClient.get(`/motel-tenants/motel/${motelId}`);
      const rawData = res.data || [];

      // 2. Truy vấn chi tiết thông tin từ API /users dựa trên userId
      const tenantList = await Promise.all(
        rawData.map(async (item) => {
          const tenantId = item.tenant?.id || item.tenantId || item.id;

          let userData = null;

          if (tenantId) {
            try {
              // Gọi API lấy User theo ID
              const userRes = await axiosClient.get(`/users/${tenantId}`);
              userData = userRes.data;
            } catch (err1) {
              // Fallback trường hợp baseURL chưa có /api
              try {
                const userRes = await axiosClient.get(`/api/users/${tenantId}`);
                userData = userRes.data;
              } catch (err2) {
                console.error(`Không thể lấy dữ liệu User ID #${tenantId}:`, err2);
              }
            }
          }

          // Trích xuất thông tin Tên và SĐT linh hoạt
          const fullName = 
            userData?.fullName || 
            userData?.name || 
            userData?.username || 
            item.fullName || 
            item.tenant?.fullName || 
            `Khách thuê #${tenantId}`;

          const phone = 
            userData?.phone || 
            userData?.phoneNumber || 
            item.phone || 
            item.tenant?.phone || 
            '';

          return {
            id: tenantId,
            userId: tenantId,
            fullName: fullName,
            phone: phone
          };
        })
      );

      setTenants(tenantList);
      return tenantList;
    } catch (err) {
      console.error('Lỗi tải danh sách khách thuê:', err);
      setTenants([]);
      return [];
    } finally {
      setIsFetchingTenants(false);
    }
  };

  // Sự kiện khi chọn Dãy trọ
  const handleMotelChange = async (e) => {
    const motelId = e.target.value;
    setSelectedMotelId(motelId);
    
    setFormData(prev => ({ ...prev, roomId: '', tenantId: '', rentPrice: '' }));

    if (motelId) {
      await Promise.all([
        fetchRoomsByMotel(motelId),
        fetchTenantsByMotel(motelId)
      ]);
    } else {
      setRooms([]);
      setTenants([]);
    }
  };

  const handleRoomChange = (e) => {
    const selectedRoomId = e.target.value;
    const selectedRoom = rooms.find(r => String(r.id) === String(selectedRoomId));
    
    const roomPrice = selectedRoom?.rentPrice ?? selectedRoom?.price ?? selectedRoom?.rentalPrice ?? '';

    setFormData(prev => ({
      ...prev,
      roomId: selectedRoomId,
      rentPrice: roomPrice
    }));
  };

  const resetForm = () => {
    setFormData({
      tenantId: '',
      roomId: '',
      startDate: '',
      endDate: '',
      deposit: '',
      rentPrice: '',
      status: 'ACTIVE'
    });
    setSelectedMotelId('');
    setRooms([]);
    setTenants([]);
    setEditingId(null);
    setErrorMessage('');
  };

  const handleEditClick = async (contract) => {
    setEditingId(contract.id);
    setErrorMessage('');
    
    const motelId = contract.room?.motelId || contract.room?.motel?.id || '';
    setSelectedMotelId(motelId);

    if (motelId) {
      await Promise.all([
        fetchRoomsByMotel(motelId),
        fetchTenantsByMotel(motelId)
      ]);
    }

    setFormData({
      tenantId: contract.tenant?.id || '',
      roomId: contract.room?.id || '',
      startDate: contract.startDate || '',
      endDate: contract.endDate || '',
      deposit: contract.deposit ?? '',
      rentPrice: contract.rentPrice ?? contract.rentalPrice ?? contract.price ?? contract.room?.price ?? '',
      status: contract.status || 'ACTIVE'
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const payload = {
      tenantId: formData.tenantId ? Number(formData.tenantId) : null,
      roomId: formData.roomId ? Number(formData.roomId) : null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      deposit: formData.deposit !== '' ? Number(formData.deposit) : 0,
      rentPrice: formData.rentPrice !== '' ? Number(formData.rentPrice) : 0,
      status: formData.status
    };

    try {
      if (editingId) {
        await axiosClient.put(`/contracts/${editingId}`, payload);
        alert('Cập nhật hợp đồng thành công!');
      } else {
        await axiosClient.post('/contracts', payload);
        alert('Tạo hợp đồng thành công!');
      }

      resetForm();
      fetchInitialData();
    } catch (err) {
      console.error('Lỗi khi lưu hợp đồng:', err);
      setErrorMessage(err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra khi lưu!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
      try {
        await axiosClient.delete(`/contracts/${id}`);
        alert('Xóa thành công!');
        fetchInitialData();
      } catch (err) {
        console.error('Lỗi xóa hợp đồng:', err);
        alert('Xóa thất bại!');
      }
    }
  };

  const filteredContracts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return contracts.filter(c => {
      const tenantName = (c.tenant?.fullName || c.tenant?.name || '').toLowerCase();
      const roomNum = c.room?.roomNumber ? String(c.room.roomNumber).toLowerCase() : '';
      const roomCode = c.room?.roomCode || c.room?.code ? String(c.room?.roomCode || c.room?.code).toLowerCase() : '';
      const motelName = (c.room?.motel?.name || c.room?.motelName || c.motelName || '').toLowerCase();

      const matchesSearch = !search || tenantName.includes(search) || roomNum.includes(search) || roomCode.includes(search) || motelName.includes(search);
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'ACTIVE').length,
      expired: contracts.filter(c => c.status === 'EXPIRED').length,
      terminated: contracts.filter(c => c.status === 'TERMINATED').length
    };
  }, [contracts]);

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '0 ₫';
    const num = Number(amount);
    return isNaN(num) ? '0 ₫' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge bg-success">Đang hiệu lực</span>;
      case 'EXPIRED':
        return <span className="badge bg-danger">Đã hết hạn</span>;
      case 'TERMINATED':
        return <span className="badge bg-secondary">Đã thanh lý</span>;
      default:
        return <span className="badge bg-dark">{status}</span>;
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">📜 Quản Lý Hợp Đồng Thuê Phòng</h3>

        {/* THỐNG KÊ NHANH */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm border-start border-4 border-primary p-3">
              <small className="text-muted fw-semibold">TỔNG HỢP ĐỒNG</small>
              <h4 className="fw-bold m-0 text-primary">{stats.total}</h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm border-start border-4 border-success p-3">
              <small className="text-muted fw-semibold">ĐANG HIỆU LỰC</small>
              <h4 className="fw-bold m-0 text-success">{stats.active}</h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm border-start border-4 border-danger p-3">
              <small className="text-muted fw-semibold">ĐÃ HẾT HẠN</small>
              <h4 className="fw-bold m-0 text-danger">{stats.expired}</h4>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm border-start border-4 border-secondary p-3">
              <small className="text-muted fw-semibold">ĐÃ THANH LÝ</small>
              <h4 className="fw-bold m-0 text-secondary">{stats.terminated}</h4>
            </div>
          </div>
        </div>

        {/* FORM THÊM / SỬA */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-primary">
                {editingId ? '📝 Cập Nhật Hợp Đồng' : '➕ Lập Hợp Đồng Mới'}
              </h5>
              {editingId && (
                <button className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="alert alert-danger py-2 mb-3">{errorMessage}</div>
            )}

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Dãy Trọ (*)</label>
                <select
                  className="form-select"
                  required
                  value={selectedMotelId}
                  onChange={handleMotelChange}
                >
                  <option value="">-- Chọn Dãy Trọ --</option>
                  {motels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.motelName || `Dãy trọ #${m.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Khách Thuê (*)</label>
                <select
                  className="form-select"
                  required
                  disabled={!selectedMotelId || isFetchingTenants}
                  value={formData.tenantId}
                  onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                >
                  <option value="">
                    {isFetchingTenants
                      ? 'Đang tải tên khách...'
                      : !selectedMotelId
                      ? '-- Chọn dãy trọ trước --'
                      : tenants.length === 0
                      ? '-- Không có khách ở dãy này --'
                      : '-- Chọn Khách Thuê --'}
                  </option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Phòng Trọ (*)</label>
                <select
                  className="form-select"
                  required
                  disabled={!selectedMotelId || isFetchingRooms}
                  value={formData.roomId}
                  onChange={handleRoomChange}
                >
                  <option value="">
                    {isFetchingRooms
                      ? 'Đang tải phòng...'
                      : !selectedMotelId
                      ? '-- Chọn dãy trọ trước --'
                      : '-- Chọn Phòng --'}
                  </option>
                  {rooms.map(r => {
                    const roomPrice = r.rentPrice ?? r.price ?? r.rentalPrice;
                    return (
                      <option key={r.id} value={r.id}>
                        Phòng {r.roomNumber || r.roomCode || r.name} {roomPrice ? `- (${formatMoney(roomPrice)})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Trạng Thái</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Hiệu lực (ACTIVE)</option>
                  <option value="EXPIRED">Hết hạn (EXPIRED)</option>
                  <option value="TERMINATED">Thanh lý (TERMINATED)</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Ngày Bắt Đầu (*)</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Ngày Kết Thúc (*)</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Giá Thuê / Tháng (VNĐ) (*)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="VD: 3000000"
                  required
                  value={formData.rentPrice}
                  onChange={e => setFormData({ ...formData, rentPrice: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Tiền Cọc (VNĐ)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="VD: 3000000"
                  value={formData.deposit}
                  onChange={e => setFormData({ ...formData, deposit: e.target.value })}
                />
              </div>

              <div className="col-12 text-end mt-3">
                <button
                  type="submit"
                  className={`btn ${editingId ? 'btn-warning' : 'btn-primary'} fw-bold px-4`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang lưu...
                    </span>
                  ) : (editingId ? 'Lưu Thay Đổi' : 'Tạo Hợp Đồng')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* DANH SÁCH HỢP ĐỒNG */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h5 className="fw-bold m-0">Danh Sách Hợp Đồng ({filteredContracts.length})</h5>
            
            <div className="d-flex gap-2">
              <select 
                className="form-select form-select-sm" 
                style={{ width: '160px' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hiệu lực</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="TERMINATED">Thanh lý</option>
              </select>

              <div style={{ width: '250px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="🔍 Tìm tên khách, dãy, phòng..."
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
                    <th>Khách Thuê</th>
                    <th>Dãy Trọ</th>
                    <th>Phòng</th>
                    <th>Thời Hạn Hợp Đồng</th>
                    <th>Giá Thuê</th>
                    <th>Tiền Cọc</th>
                    <th>Trạng Thái</th>
                    <th className="text-center">Thao Tác</th>
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
                  ) : filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        Chưa có dữ liệu hợp đồng tương ứng.
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map(c => {
                      const motelName = c.room?.motel?.name || c.room?.motelName || c.motelName || '---';
                      const tenantName = c.tenant?.fullName || c.tenant?.name || c.tenantName || '---';

                      return (
                        <tr key={c.id} className={editingId === c.id ? 'table-warning' : ''}>
                          <td className="fw-bold text-primary">{tenantName}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              🏢 {motelName}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              Phòng {c.room?.roomNumber || c.room?.roomCode || c.room?.name || '---'}
                            </span>
                          </td>
                          <td>
                            <small className="fw-semibold text-dark">
                              {c.startDate} ➔ {c.endDate}
                            </small>
                          </td>
                          <td className="fw-bold text-success">
                            {formatMoney(c.rentPrice ?? c.rentalPrice ?? c.price ?? c.room?.price)}
                          </td>
                          <td>{formatMoney(c.deposit)}</td>
                          <td>{renderStatusBadge(c.status)}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-info me-1"
                              onClick={() => setSelectedContract(c)}
                              title="Xem chi tiết"
                            >
                              👁 Chi tiết
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning me-1"
                              onClick={() => handleEditClick(c)}
                              title="Chỉnh sửa"
                            >
                              Sửa
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(c.id)}
                              title="Xóa hợp đồng"
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
          </div>
        </div>

        {/* MODAL CHI TIẾT HỢP ĐỒNG */}
        {selectedContract && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-lg overflow-hidden" style={{ borderRadius: '16px' }}>
                
                {/* Header Modal */}
                <div className="modal-header bg-dark text-white px-4 py-3 border-0 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="bg-primary rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                      📋
                    </span>
                    <div>
                      <h5 className="modal-title fw-bold m-0 lh-1">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h5>
                      <small className="text-muted fs-7">Mã số: #{selectedContract.id}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div>{renderStatusBadge(selectedContract.status)}</div>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white ms-2" 
                      onClick={() => setSelectedContract(null)}
                    ></button>
                  </div>
                </div>

                {/* Body Modal - Phong cách Văn Bản Hợp Đồng */}
                <div className="modal-body p-4 bg-light">
                  <div className="bg-white p-4 rounded-3 shadow-sm border">
                    
                    {/* Quốc hiệu Tiêu ngữ */}
                    <div className="text-center mb-4 pb-3 border-bottom">
                      <h6 className="fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h6>
                      <p className="fw-semibold text-secondary small mb-3">Độc lập - Tự do - Hạnh phúc</p>
                      <h4 className="fw-bold text-primary text-uppercase mt-3 mb-0">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h4>
                    </div>

                    {/* BÊN A & BÊN B */}
                    <div className="row g-3 mb-4">
                      {/* Bên A: Chủ Trọ */}
                      <div className="col-md-6">
                        <div className="p-3 rounded-3 bg-light border border-dashed h-100">
                          <div className="d-flex align-items-center gap-2 mb-2 text-primary border-bottom pb-2">
                            <span className="fw-bold">🏢 BÊN A (BÊN CHO THUÊ)</span>
                          </div>
                          <div className="small space-y-1">
                            <p className="mb-1"><strong>Chủ sở hữu:</strong> <span className="fw-bold text-dark">{ownerName}</span></p>
                            <p className="mb-1"><strong>Dãy trọ:</strong> {selectedContract.room?.motel?.name || selectedContract.room?.motelName || selectedContract.motelName || '---'}</p>
                            <p className="mb-0"><strong>Địa chỉ:</strong> {selectedContract.room?.motel?.address || selectedContract.room?.address || '---'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bên B: Khách Thuê */}
                      <div className="col-md-6">
                        <div className="p-3 rounded-3 bg-light border border-dashed h-100">
                          <div className="d-flex align-items-center gap-2 mb-2 text-success border-bottom pb-2">
                            <span className="fw-bold">👤 BÊN B (BÊN THUÊ)</span>
                          </div>
                          <div className="small space-y-1">
                            <p className="mb-1"><strong>Họ và tên:</strong> <span className="fw-bold text-dark">{selectedContract.tenant?.fullName || selectedContract.tenant?.name || '---'}</span></p>
                            <p className="mb-1"><strong>Số điện thoại:</strong> {selectedContract.tenant?.phone || '---'}</p>
                            <p className="mb-0"><strong>CCCD/CMND:</strong> {selectedContract.tenant?.identityCard || selectedContract.tenant?.cccd || '---'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* THÔNG TIN CHI TIẾT PHÒNG VÀ ĐIỀU KHOẢN TÀI CHÍNH */}
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <span className="badge bg-primary rounded-pill">1</span> Thông Tin Phòng & Tài Chính
                    </h6>
                    
                    <div className="table-responsive mb-4">
                      <table className="table table-bordered table-sm align-middle text-center mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Số / Mã Phòng</th>
                            <th>Diện Tích</th>
                            <th>Giá Thuê Hàng Tháng</th>
                            <th>Tiền Đặt Cọc</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="fw-bold text-primary">Phòng {selectedContract.room?.roomNumber || selectedContract.room?.roomCode || selectedContract.room?.name || '---'}</td>
                            <td>{selectedContract.room?.area ? `${selectedContract.room.area} m²` : '---'}</td>
                            <td className="fw-bold text-success">{formatMoney(selectedContract.rentPrice ?? selectedContract.rentalPrice ?? selectedContract.price ?? selectedContract.room?.price)}</td>
                            <td className="fw-bold text-primary">{formatMoney(selectedContract.deposit)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* THỜI HẠN HỢP ĐỒNG */}
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <span className="badge bg-primary rounded-pill">2</span> Thời Hạn Hợp Đồng
                    </h6>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="p-3 rounded bg-light d-flex align-items-center justify-content-between border">
                          <div>
                            <small className="text-muted d-block">Ngày bắt đầu hiệu lực</small>
                            <strong className="text-dark fs-6">{selectedContract.startDate || '---'}</strong>
                          </div>
                          <span className="fs-4 text-success">📅</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 rounded bg-light d-flex align-items-center justify-content-between border">
                          <div>
                            <small className="text-muted d-block">Ngày hết hạn hợp đồng</small>
                            <strong className="text-dark fs-6">{selectedContract.endDate || '---'}</strong>
                          </div>
                          <span className="fs-4 text-danger">⌛</span>
                        </div>
                      </div>
                    </div>

                    {/* CHỮ KÝ XÁC NHẬN */}
                    <div className="row text-center mt-5 pt-3 border-top">
                      <div className="col-6">
                        <p className="fw-bold text-dark mb-1">ĐẠI DIỆN BÊN A</p>
                        <small className="text-muted">(Ký và ghi rõ họ tên)</small>
                        <div style={{ height: '70px' }}></div>
                        <p className="fw-semibold text-dark mb-0">{ownerName}</p>
                      </div>
                      <div className="col-6">
                        <p className="fw-bold text-dark mb-1">ĐẠI DIỆN BÊN B</p>
                        <small className="text-muted">(Ký và ghi rõ họ tên)</small>
                        <div style={{ height: '70px' }}></div>
                        <p className="fw-semibold text-dark mb-0">{selectedContract.tenant?.fullName || selectedContract.tenant?.name || 'Khách Thuê'}</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer Modal Action Buttons */}
                <div className="modal-footer bg-white px-4 py-3 border-top d-flex justify-content-between">
                  <span className="small text-muted">
                    💡 Bạn có thể in hoặc lưu dưới dạng PDF.
                  </span>
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-light border px-4 fw-semibold" 
                      onClick={() => setSelectedContract(null)}
                    >
                      Đóng
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary px-4 fw-semibold shadow-sm"
                      onClick={() => window.print()}
                    >
                      🖨 In hợp đồng
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}