import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function MotelManagement() {
  const [motels, setMotels] = useState([]);
  const [formData, setFormData] = useState({ name: '', address: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingMotelId, setEditingMotelId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const userId = Number(localStorage.getItem('userId')) || 1;

  useEffect(() => {
    fetchMotels();
  }, []);

  const fetchMotels = async () => {
    setIsFetching(true);
    try {
      const res = await axiosClient.get(`/motels?userId=${userId}`);
      setMotels(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách dãy trọ:', err);
      setErrorMessage('Không thể tải danh sách dãy trọ từ máy chủ.');
    } finally {
      setIsFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', description: '' });
    setEditingMotelId(null);
    setErrorMessage('');
  };

  const handleEditClick = (motel) => {
    setEditingMotelId(motel.id);
    setFormData({
      name: motel.name || '',
      address: motel.address || '',
      description: motel.description || ''
    });
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        userId: userId
      };

      if (editingMotelId) {
        await axiosClient.put(`/motels/${editingMotelId}`, payload);
        alert('Cập nhật dãy trọ thành công!');
      } else {
        await axiosClient.post('/motels', payload);
        alert('Thêm dãy trọ thành công!');
      }

      resetForm();
      fetchMotels();
    } catch (err) {
      console.error('Lỗi khi lưu thông tin dãy trọ:', err);
      setErrorMessage(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMotel = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa dãy trọ "${name}" không?`)) {
      try {
        await axiosClient.delete(`/motels/${id}`);
        alert('Xóa dãy trọ thành công!');
        fetchMotels();
      } catch (err) {
        console.error('Lỗi khi xóa dãy trọ:', err);
        alert('Xóa thất bại! Vui lòng kiểm tra lại kết nối.');
      }
    }
  };

  const filteredMotels = motels.filter(m => {
    const name = (m.name || '').toLowerCase();
    const address = (m.address || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || address.includes(search);
  });

  return (
    <div className="d-flex flex-column min-vh-100 bg-light w-100 overflow-x-hidden">
      {/* CSS tùy chỉnh Responsive Margin & Layout */}
      <style>{`
        .main-content-area {
          margin-left: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
        }
        @media (min-width: 992px) {
          .main-content-area {
            margin-left: 260px !important;
            width: calc(100% - 260px) !important;
          }
        }
      `}</style>

      {/* Header Mobile - Hiển thị ở màn hình < 992px */}
      <header className="navbar navbar-dark bg-primary sticky-top px-3 shadow-sm d-lg-none d-print-none" style={{ zIndex: 1030, height: '56px' }}>
        <div className="d-flex align-items-center w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-link text-white p-0 border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
              <i className="bi bi-list fs-3"></i>
            </button>
            <span className="navbar-brand fw-bold mb-0 me-0 fs-6">QUẢN LÝ DÃY TRỌ</span>
          </div>
          <button 
            className="btn btn-sm btn-light text-primary fw-semibold rounded-pill px-3" 
            onClick={fetchMotels}
            disabled={isFetching}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${isFetching ? 'spin' : ''}`}></i>Làm mới
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="d-flex flex-grow-1 w-100">
        {/* Sidebar Nav */}
        <div className="d-print-none">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="main-content-area flex-grow-1 p-3 p-md-4 overflow-hidden">
          {/* Action Bar trên Desktop */}
          <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
            <button 
              className="btn btn-outline-primary btn-sm rounded-pill px-3 d-none d-lg-inline-flex align-items-center" 
              onClick={fetchMotels}
              disabled={isFetching}
            >
              <i className={`bi bi-arrow-clockwise me-1 ${isFetching ? 'spin' : ''}`}></i> Làm mới
            </button>
          </div>

          {/* --- FORM THÊM / CẬP NHẬT --- */}
          <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold m-0 text-primary fs-6 fs-md-5">
                  {editingMotelId ? '📝 Cập Nhật Dãy Trọ' : '➕ Thêm Dãy Trọ Mới'}
                </h5>
                {editingMotelId && (
                  <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={resetForm}>
                    <i className="bi bi-x-circle me-1"></i> Hủy
                  </button>
                )}
              </div>

              {errorMessage && (
                <div className="alert alert-danger py-2 mb-3 small rounded-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Tên dãy trọ (*)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="VD: Dãy Trọ Bình An" 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Địa chỉ (*)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="VD: 123 Đường Xuân Thủy" 
                      required 
                      value={formData.address} 
                      onChange={e => setFormData({ ...formData, address: e.target.value })} 
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold small">Ghi chú / Mô tả</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Mô tả thêm" 
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="mt-3 text-end">
                  {editingMotelId && (
                    <button type="button" className="btn btn-secondary me-2 px-3 rounded-3" onClick={resetForm}>
                      Hủy
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className={`btn ${editingMotelId ? 'btn-warning' : 'btn-primary'} fw-bold px-4 w-100 w-sm-auto rounded-3`} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className={`bi ${editingMotelId ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                        {editingMotelId ? 'Lưu Cập Nhật' : 'Thêm Dãy Trọ'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* --- BẢNG HIỂN THỊ DANH SÁCH --- */}
          <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
            <div className="card-header bg-white py-3 px-3 px-md-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 border-bottom-0">
              <h5 className="fw-bold m-0 fs-6 fs-md-5">Danh Sách Dãy Trọ ({filteredMotels.length})</h5>
              
              <div className="w-100 w-sm-auto" style={{ maxWidth: '280px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-pill px-3"
                  placeholder="🔍 Tìm tên hoặc địa chỉ..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-nowrap">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: '80px' }} className="ps-3 ps-md-4">Mã ID</th>
                      <th>Tên Dãy Trọ</th>
                      <th>Địa Chỉ</th>
                      <th>Mô Tả</th>
                      <th className="text-center pe-3 pe-md-4" style={{ width: '140px' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isFetching ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2 text-muted small mb-0">Đang tải danh sách dãy trọ...</p>
                        </td>
                      </tr>
                    ) : filteredMotels.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <i className="bi bi-inbox display-6 d-block mb-2"></i>
                          Chưa có dãy trọ nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredMotels.map(m => (
                        <tr key={m.id} className={editingMotelId === m.id ? 'table-warning' : ''}>
                          <td className="fw-semibold ps-3 ps-md-4">#{m.id}</td>
                          <td className="fw-bold text-primary">{m.name}</td>
                          <td>{m.address}</td>
                          <td className="text-muted">{m.description || '---'}</td>
                          <td className="text-center pe-3 pe-md-4">
                            <div className="d-flex justify-content-center gap-1">
                              <button 
                                className="btn btn-sm btn-outline-warning rounded-2"
                                onClick={() => handleEditClick(m)}
                                title="Sửa dãy trọ"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger rounded-2"
                                onClick={() => handleDeleteMotel(m.id, m.name)}
                                title="Xóa dãy trọ"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}