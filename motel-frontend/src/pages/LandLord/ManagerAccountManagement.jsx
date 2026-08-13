import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function ManagerAccountManagement() {
  const [managers, setManagers] = useState([]);
  const [motels, setMotels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals status
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State Cấp / Sửa tài khoản
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    assignedMotelId: '',
    status: 'ACTIVE'
  });

  const landlordId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [resManagers, resMotels] = await Promise.all([
        axiosClient.get(`/managers?landlordId=${landlordId}`).catch(() => ({ data: [] })),
        axiosClient.get(`/motels?userId=${landlordId}`).catch(() => ({ data: [] }))
      ]);

      setManagers(resManagers.data || []);
      setMotels(resMotels.data || []);
    } catch (err) {
      setErrorMessage('Không thể tải danh sách tài khoản Manager.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      id: '',
      fullName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      assignedMotelId: motels[0]?.id || '',
      status: 'ACTIVE'
    });
    setErrorMessage('');
    setSuccessMessage('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (manager) => {
    setFormData({
      id: manager.id,
      fullName: manager.fullName || manager.name || '',
      email: manager.email || '',
      phone: manager.phone || '',
      username: manager.username || '',
      password: '', // Mật khẩu mới nếu muốn đổi
      assignedMotelId: manager.assignedMotelId || manager.motelId || '',
      status: manager.status || 'ACTIVE'
    });
    setErrorMessage('');
    setSuccessMessage('');
    setShowEditModal(true);
  };

  // Tạo mới Tài Khoản Manager
  const handleCreateManager = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await axiosClient.post('/managers', {
        ...formData,
        landlordId: Number(landlordId),
        role: 'MANAGER'
      });
      setSuccessMessage('Cấp tài khoản Manager thành công!');
      setShowAddModal(false);
      fetchInitialData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Không thể tạo tài khoản Manager!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật thông tin / Đổi mật khẩu Manager
  const handleUpdateManager = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await axiosClient.put(`/managers/${formData.id}`, {
        ...formData,
        landlordId: Number(landlordId)
      });
      setSuccessMessage('Cập nhật thông tin Manager thành công!');
      setShowEditModal(false);
      fetchInitialData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (manager) => {
    const newStatus = manager.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const confirmText = newStatus === 'BLOCKED' 
      ? `Bạn có chắc chắn muốn KHÓA tài khoản ${manager.fullName || manager.username}?`
      : `Bạn muốn MỞ KHÓA tài khoản ${manager.fullName || manager.username}?`;

    if (!window.confirm(confirmText)) return;

    try {
      await axiosClient.patch(`/managers/${manager.id}/status`, { status: newStatus });
      setSuccessMessage(`Đã ${newStatus === 'BLOCKED' ? 'khóa' : 'kích hoạt'} tài khoản thành công!`);
      fetchInitialData();
    } catch (err) {
      alert('Không thể thay đổi trạng thái tài khoản!');
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar cố định */}
      <Sidebar />

      {/* Nội dung chính lệch 260px */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>

        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold mb-1">👥 Quản Lý Tài Khoản Manager</h3>
            <p className="text-muted m-0">Phân quyền và quản lý tài khoản người quản lý các dãy trọ</p>
          </div>

          <button className="btn btn-primary fw-bold shadow-sm" onClick={handleOpenAddModal}>
            <i className="bi bi-person-plus-fill me-2"></i> Cấp Tài Khoản Mới
          </button>
        </div>

        {/* Thông báo Alert */}
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success py-2 mb-4">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
          </div>
        )}

        {/* Bảng Danh Sách Manager */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h5 className="fw-bold m-0 text-dark">
              <i className="bi bi-people-fill me-2 text-primary"></i>
              Danh Sách Người Quản Lý ({managers.length})
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Họ & Tên</th>
                    <th>Tên Đăng Nhập</th>
                    <th>Liên Hệ</th>
                    <th>Dãy Trọ Phụ Trách</th>
                    <th>Trạng Thái</th>
                    <th className="text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                      </td>
                    </tr>
                  ) : managers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        Chưa có tài khoản Manager nào được cấp.
                      </td>
                    </tr>
                  ) : (
                    managers.map((mgr) => {
                      const assignedMotel = motels.find(m => String(m.id) === String(mgr.assignedMotelId || mgr.motelId));
                      const isActive = mgr.status !== 'BLOCKED' && mgr.status !== 'INACTIVE';

                      return (
                        <tr key={mgr.id}>
                          <td className="fw-bold text-primary">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                {(mgr.fullName || mgr.username || 'M').charAt(0).toUpperCase()}
                              </div>
                              {mgr.fullName || 'Chưa cập nhật'}
                            </div>
                          </td>
                          <td className="fw-semibold">@{mgr.username}</td>
                          <td>
                            <div className="small">
                              <div><i className="bi bi-telephone text-muted me-1"></i> {mgr.phone || 'N/A'}</div>
                              <div><i className="bi bi-envelope text-muted me-1"></i> {mgr.email || 'N/A'}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info text-dark">
                              <i className="bi bi-building me-1"></i>
                              {assignedMotel?.name || `Dãy #${mgr.assignedMotelId || 'Tất cả'}`}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${isActive ? 'bg-success' : 'bg-danger'}`}>
                              {isActive ? '✓ Hoạt Động' : '🔒 Đã Khóa'}
                            </span>
                          </td>
                          <td className="text-center">
                            <button 
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleOpenEditModal(mgr)}
                              title="Sửa / Đổi mật khẩu"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button 
                              className={`btn btn-sm ${isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => handleToggleStatus(mgr)}
                              title={isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                            >
                              <i className={`bi ${isActive ? 'bi-lock-fill' : 'bi-unlock-fill'}`}></i>
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

        {/* Modal Thêm Mới Manager */}
        {showAddModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">➕ Cấp Tài Khoản Manager Mới</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                </div>
                <form onSubmit={handleCreateManager}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Họ và Tên (*)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        placeholder="Nguyễn Văn A"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-semibold">Tên Đăng Nhập (*)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required
                          placeholder="manager01"
                          value={formData.username}
                          onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">Mật Khẩu (*)</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          required
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-semibold">Số Điện Thoại</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="0912..."
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          placeholder="manager@gmail.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Giao Dãy Trọ Quản Lý (*)</label>
                      <select 
                        className="form-select"
                        required
                        value={formData.assignedMotelId}
                        onChange={e => setFormData({ ...formData, assignedMotelId: e.target.value })}
                      >
                        <option value="">-- Chọn Dãy Trọ --</option>
                        {motels.map(m => (
                          <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary fw-bold" disabled={isSubmitting}>
                      {isSubmitting ? 'Đang Tạo...' : 'Tạo Tài Khoản'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa / Đổi Mật Khẩu Manager */}
        {showEditModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-dark text-white">
                  <h5 className="modal-title fw-bold">✏️ Sửa Thông Tin Manager</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
                </div>
                <form onSubmit={handleUpdateManager}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Họ và Tên</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-semibold">Số Điện Thoại</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Mật Khẩu Mới (Để trống nếu giữ nguyên)</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Giao Dãy Trọ Quản Lý</label>
                      <select 
                        className="form-select"
                        value={formData.assignedMotelId}
                        onChange={e => setFormData({ ...formData, assignedMotelId: e.target.value })}
                      >
                        {motels.map(m => (
                          <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary fw-bold" disabled={isSubmitting}>
                      {isSubmitting ? 'Đang Lưu...' : 'Cập Nhật'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}