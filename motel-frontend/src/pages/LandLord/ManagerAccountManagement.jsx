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

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Initial Form State
  const initialFormState = {
    id: '',
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    assignedMotelId: '',
    status: 'ACTIVE'
  };

  const [formData, setFormData] = useState(initialFormState);
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

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenAddModal = () => {
    setFormData({
      ...initialFormState,
      assignedMotelId: motels[0]?.id || ''
    });
    clearMessages();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (manager) => {
    setFormData({
      id: manager.id,
      fullName: manager.fullName || manager.name || '',
      email: manager.email || '',
      phone: manager.phone || '',
      username: manager.username || '',
      password: '',
      assignedMotelId: manager.assignedMotelId || manager.motelId || '',
      status: manager.status || 'ACTIVE'
    });
    clearMessages();
    setShowEditModal(true);
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

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

  const handleUpdateManager = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    const updatePayload = {
      ...formData,
      landlordId: Number(landlordId)
    };
    if (!updatePayload.password) {
      delete updatePayload.password;
    }

    try {
      await axiosClient.put(`/managers/${formData.id}`, updatePayload);
      setSuccessMessage('Cập nhật thông tin Manager thành công!');
      setShowEditModal(false);
      fetchInitialData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (manager) => {
    const isCurrentlyActive = manager.status !== 'BLOCKED' && manager.status !== 'INACTIVE';
    const newStatus = isCurrentlyActive ? 'BLOCKED' : 'ACTIVE';
    const actionName = isCurrentlyActive ? 'KHÓA' : 'MỞ KHÓA';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản ${manager.fullName || manager.username}?`)) {
      return;
    }

    try {
      await axiosClient.patch(`/managers/${manager.id}/status`, { status: newStatus });
      setSuccessMessage(`Đã ${isCurrentlyActive ? 'khóa' : 'kích hoạt'} tài khoản thành công!`);
      fetchInitialData();
    } catch (err) {
      setErrorMessage('Không thể thay đổi trạng thái tài khoản!');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header Mobile - Chỉ hiện trên màn hình < 992px */}
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

      {/* Responsive Style cho Sidebar & Container */}
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
        {/* Sidebar Component */}
        <Sidebar />

        {/* Nội dung chính */}
        <div className="main-content-area flex-grow-1 p-3 p-md-4">
          {/* Header Trang */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">

            <button className="btn btn-primary fw-bold shadow-sm w-100 w-sm-auto" onClick={handleOpenAddModal}>
              <i className="bi bi-person-plus-fill me-2"></i> Cấp Tài Khoản Mới
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="alert alert-danger py-2 mb-4 d-flex align-items-center justify-content-between">
              <div className="small">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errorMessage}
              </div>
              <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success py-2 mb-4 d-flex align-items-center justify-content-between">
              <div className="small">
                <i className="bi bi-check-circle-fill me-2"></i>
                {successMessage}
              </div>
              <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
            </div>
          )}

          {/* Bảng Danh Sách Manager */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold m-0 text-dark">
                <i className="bi bi-people-fill me-2 text-primary"></i>
                Danh Sách Người Quản Lý ({managers.length})
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-nowrap">
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
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                          <span className="small text-muted">Đang tải dữ liệu...</span>
                        </td>
                      </tr>
                    ) : managers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted small">
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
                                <div 
                                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold flex-shrink-0" 
                                  style={{ width: '32px', height: '32px', fontSize: '12px' }}
                                >
                                  {(mgr.fullName || mgr.username || 'M').charAt(0).toUpperCase()}
                                </div>
                                <span>{mgr.fullName || 'Chưa cập nhật'}</span>
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
                                {assignedMotel?.name || (mgr.assignedMotelId ? `Dãy #${mgr.assignedMotelId}` : 'Chưa phân công')}
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
              <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
                <div className="modal-content border-0 shadow">
                  <div className="modal-header bg-primary text-white py-2">
                    <h5 className="modal-title fw-bold fs-6">➕ Cấp Tài Khoản Manager Mới</h5>
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
                        <div className="col-12 col-sm-6">
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
                        <div className="col-12 col-sm-6">
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
                        <div className="col-12 col-sm-6">
                          <label className="form-label fw-semibold">Số Điện Thoại</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="0912..."
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div className="col-12 col-sm-6">
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
                    <div className="modal-footer bg-light py-2">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Hủy</button>
                      <button type="submit" className="btn btn-primary btn-sm fw-bold" disabled={isSubmitting}>
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
              <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
                <div className="modal-content border-0 shadow">
                  <div className="modal-header bg-dark text-white py-2">
                    <h5 className="modal-title fw-bold fs-6">✏️ Sửa Thông Tin Manager</h5>
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
                        <div className="col-12 col-sm-6">
                          <label className="form-label fw-semibold">Số Điện Thoại</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div className="col-12 col-sm-6">
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
                        <label className="form-label fw-semibold">Mật Khẩu Mới</label>
                        <input 
                          type="password" 
                          className="form-control" 
                          placeholder="Để trống nếu không muốn đổi"
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
                          <option value="">-- Chọn Dãy Trọ --</option>
                          {motels.map(m => (
                            <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer bg-light py-2">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>Hủy</button>
                      <button type="submit" className="btn btn-primary btn-sm fw-bold" disabled={isSubmitting}>
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
    </div>
  );
}