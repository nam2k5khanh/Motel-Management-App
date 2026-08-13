import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function MotelManagement() {
  const [motels, setMotels] = useState([]);
  const [formData, setFormData] = useState({ name: '', address: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // State quản lý việc Chỉnh sửa (Edit)
  const [editingMotelId, setEditingMotelId] = useState(null);

  // State quản lý trạng thái Lỗi và Loading
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const userId = Number(localStorage.getItem('userId')) || 1;

  useEffect(() => {
    fetchMotels();
  }, []);

  // Lấy danh sách dãy trọ
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

  // Reset Form về trạng thái ban đầu
  const resetForm = () => {
    setFormData({ name: '', address: '', description: '' });
    setEditingMotelId(null);
    setErrorMessage('');
  };

  // Chọn 1 dãy trọ để Sửa (Đổ dữ liệu lên Form)
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

  // Xử lý Submit Form (Gồm cả Thêm mới và Cập nhật)
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
        // --- CẬP NHẬT DÃY TRỌ (PUT) ---
        await axiosClient.put(`/motels/${editingMotelId}`, payload);
        alert('Cập nhật dãy trọ thành công!');
      } else {
        // --- THÊM DÃY TRỌ MỚI (POST) ---
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

  // Xử lý Xóa Dãy Trọ
  const handleDeleteMotel = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa dãy trọ "${name}" không?\nLưu ý: Các phòng trọ thuộc dãy trọ này cũng có thể bị ảnh hưởng!`)) {
      try {
        await axiosClient.delete(`/motels/${id}`);
        alert('Xóa dãy trọ thành công!');
        fetchMotels();
      } catch (err) {
        console.error('Lỗi khi xóa dãy trọ:', err);
        alert('Xóa thất bại! Vui lòng kiểm tra lại kết nối hoặc dữ liệu ràng buộc.');
      }
    }
  };

  // Lọc dãy trọ theo từ khóa tìm kiếm
  const filteredMotels = motels.filter(m => {
    const name = (m.name || '').toLowerCase();
    const address = (m.address || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || address.includes(search);
  });

  return (
    <div className="d-flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính thụt lề 260px khớp với Sidebar */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">🏢 Quản Lý Dãy Trọ</h3>

        {/* --- FORM THÊM / CẬP NHẬT --- */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-primary">
                {editingMotelId ? '📝 Cập Nhật Dãy Trọ' : '➕ Thêm Dãy Trọ Mới'}
              </h5>
              {editingMotelId && (
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
              <div className="col-md-4">
                <label className="form-label fw-semibold">Tên dãy trọ (*)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: Dãy Trọ Bình An" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Địa chỉ (*)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: 123 Đường Xuân Thủy" 
                  required 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Ghi chú / Mô tả</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Mô tả thêm (không bắt buộc)" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>

              <div className="col-12 text-end mt-3">
                {editingMotelId && (
                  <button type="button" className="btn btn-secondary me-2 px-3" onClick={resetForm}>
                    Hủy
                  </button>
                )}
                <button 
                  type="submit" 
                  className={`btn ${editingMotelId ? 'btn-warning' : 'btn-primary'} fw-bold px-4`} 
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
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h5 className="fw-bold m-0">Danh Sách Dãy Trọ ({filteredMotels.length})</h5>
            
            <div style={{ width: '250px' }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="🔍 Tìm tên hoặc địa chỉ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  {/* Dọn dẹp khoảng trắng/comment giữa các <th> để chống Hydration Error */}
                  <tr><th>Mã ID</th><th>Tên Dãy Trọ</th><th>Địa Chỉ</th><th>Mô Tả</th><th className="text-center">Thao Tác</th></tr>
                </thead>
                <tbody>
                  {isFetching ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMotels.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        Chưa có dãy trọ nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredMotels.map(m => (
                      <tr key={m.id} className={editingMotelId === m.id ? 'table-warning' : ''}>
                        <td className="fw-semibold">#{m.id}</td>
                        <td className="fw-bold text-primary">{m.name}</td>
                        <td>{m.address}</td>
                        <td className="text-muted">{m.description || '---'}</td>
                        <td className="text-center">
                          <button 
                            className="btn btn-sm btn-outline-warning me-2"
                            onClick={() => handleEditClick(m)}
                          >
                            <i className="bi bi-pencil"></i> Sửa
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteMotel(m.id, m.name)}
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
          </div>
        </div>

      </div>
    </div>
  );
}