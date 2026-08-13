import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function ManagerTenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State - Khớp hoàn toàn với Entity Tenant.java
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'NAM',
    birthday: '',
    cccd: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: ''
  });

  const [editingTenantId, setEditingTenantId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setIsFetching(true);
    try {
      const res = await axiosClient.get('/tenants');
      setTenants(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách khách thuê:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      gender: 'NAM',
      birthday: '',
      cccd: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: ''
    });
    setEditingTenantId(null);
    setErrorMessage('');
  };

  const handleEditClick = (tenant) => {
    setEditingTenantId(tenant.id);
    setFormData({
      fullName: tenant.fullName || '',
      gender: tenant.gender || 'NAM',
      birthday: tenant.birthday || '',
      cccd: tenant.cccd || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      address: tenant.address || '',
      emergencyContact: tenant.emergencyContact || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (editingTenantId) {
        await axiosClient.put(`/tenants/${editingTenantId}`, formData);
        alert('Cập nhật khách thuê thành công!');
      } else {
        await axiosClient.post('/tenants', formData);
        alert('Thêm khách thuê thành công!');
      }

      resetForm();
      fetchTenants();
    } catch (err) {
      console.error('Lỗi khi lưu khách thuê:', err);
      setErrorMessage(err.response?.data?.message || err.response?.data || 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTenant = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa khách thuê "${name}"?`)) {
      try {
        await axiosClient.delete(`/tenants/${id}`);
        alert('Xóa thành công!');
        fetchTenants();
      } catch (err) {
        console.error('Lỗi xóa khách thuê:', err);
        alert('Xóa thất bại!');
      }
    }
  };

  // Lọc khách thuê theo từ khóa tìm kiếm
  const filteredTenants = tenants.filter(t =>
    t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm) ||
    t.cccd?.includes(searchTerm)
  );

  return (
    <div className="d-flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính thụt lề 260px khớp với Sidebar */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">👥 Quản Lý Danh Sách Khách Thuê</h3>

        {/* --- FORM THÊM / SỬA KHÁCH THUÊ --- */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-primary">
                {editingTenantId ? '📝 Cập Nhật Thông Tin Khách Thuê' : '➕ Thêm Khách Thuê Mới'}
              </h5>
              {editingTenantId && (
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
                <label className="form-label fw-semibold">Họ và Tên (*)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: Nguyễn Văn A" 
                  required 
                  value={formData.fullName} 
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Số Điện Thoại (*)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: 0987654321" 
                  required 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Số CCCD/CMND (*)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: 034099xxxxxx" 
                  value={formData.cccd} 
                  onChange={e => setFormData({ ...formData, cccd: e.target.value })} 
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Giới Tính</label>
                <select 
                  className="form-select"
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="NAM">Nam</option>
                  <option value="NU">Nữ</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Ngày Sinh</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.birthday} 
                  onChange={e => setFormData({ ...formData, birthday: e.target.value })} 
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="VD: abc@gmail.com" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Liên Hệ Khẩn Cấp</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="SĐT người thân / Bạn bè" 
                  value={formData.emergencyContact} 
                  onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} 
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Địa Chỉ Thường Trú</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Quê quán / Địa chỉ trên CCCD" 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                />
              </div>

              <div className="col-12 text-end mt-3">
                {editingTenantId && (
                  <button type="button" className="btn btn-secondary me-2 px-3" onClick={resetForm}>
                    Hủy
                  </button>
                )}
                <button 
                  type="submit" 
                  className={`btn ${editingTenantId ? 'btn-warning' : 'btn-primary'} fw-bold px-4`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className={`bi ${editingTenantId ? 'bi-check-lg' : 'bi-person-plus-fill'} me-1`}></i>
                      {editingTenantId ? 'Lưu Cập Nhật' : 'Thêm Khách Thuê'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* --- THANH TÌM KIẾM VÀ BẢNG DANH SÁCH --- */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold m-0">Danh Sách Khách Thuê ({filteredTenants.length})</h5>
            <div style={{ width: '300px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="🔍 Tìm theo Tên, SĐT, CCCD..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
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
                      <th>Họ và Tên</th>
                      <th>Số Điện Thoại</th>
                      <th>CCCD</th>
                      <th>Giới Tính</th>
                      <th>Ngày Sinh</th>
                      <th>Email</th>
                      <th>Liên Hệ Khẩn Cấp</th>
                      <th className="text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          Chưa có dữ liệu khách thuê nào.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map(t => (
                        <tr key={t.id} className={editingTenantId === t.id ? 'table-warning' : ''}>
                          <td className="fw-bold text-primary">{t.fullName}</td>
                          <td>{t.phone}</td>
                          <td>{t.cccd || '---'}</td>
                          <td>
                            {t.gender === 'NAM' ? (
                              <span className="badge bg-info text-dark">Nam</span>
                            ) : t.gender === 'NU' ? (
                              <span className="badge bg-danger">Nữ</span>
                            ) : (
                              <span className="badge bg-secondary">Khác</span>
                            )}
                          </td>
                          <td>{t.birthday || '---'}</td>
                          <td>{t.email || '---'}</td>
                          <td>{t.emergencyContact || '---'}</td>
                          <td className="text-center">
                            <button 
                              className="btn btn-sm btn-outline-warning me-2"
                              onClick={() => handleEditClick(t)}
                            >
                              <i className="bi bi-pencil"></i> Sửa
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteTenant(t.id, t.fullName)}
                            >
                              <i className="bi bi-trash"></i> Xóa
                            </button>
                          </td>
                        </tr>
                      ))
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