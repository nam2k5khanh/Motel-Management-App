import React, { useState, useEffect, useCallback } from 'react';
import TenantSidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

// Helper ghép URL ảnh (Hỗ trợ cả Supabase URL và ảnh nội bộ nếu có)
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // Nếu là link Supabase hoặc link tuyệt đối (http:// hoặc https://) -> Dùng trực tiếp
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Nếu là đường dẫn tương đối cũ, lấy baseURL từ axiosClient
  const baseUrl = axiosClient.defaults.baseURL || '';
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

export default function TenantRepairRequest() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Trạng thái Modal xem ảnh lớn

  // State lưu trữ dữ liệu Form tạo báo cáo
  const [formData, setFormData] = useState({
    category: 'ELECTRIC',
    title: '',
    description: '',
    priority: 'MEDIUM',
    image: null,
  });

  const [previewImage, setPreviewImage] = useState(null);

  // Lấy User ID & Room ID từ LocalStorage
  const getUserInfo = () => {
    try {
      const storedUserId = localStorage.getItem('userId');
      const userObjRaw = localStorage.getItem('user');
      const userObj = userObjRaw ? JSON.parse(userObjRaw) : {};

      const tenantId = storedUserId ? Number(storedUserId) : (userObj.id ? Number(userObj.id) : null);
      const roomId = userObj.roomId || userObj.room?.id || userObj.roomIdCurrent || null;

      return { tenantId, roomId };
    } catch (e) {
      console.error('Lỗi khi đọc thông tin người dùng từ localStorage:', e);
      return { tenantId: null, roomId: null };
    }
  };

  // Hàm gọi API lấy danh sách báo cáo sự cố
  const fetchRepairRequests = useCallback(async () => {
    setIsLoading(true);
    const { tenantId } = getUserInfo();

    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await axiosClient.get(`/repair-requests/tenant/${tenantId}`);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách báo cáo:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairRequests();
  }, [fetchRepairRequests]);

  // Dọn dẹp URL Blob preview khi chọn ảnh khác
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // Xử lý thay đổi input text/select
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý khi người dùng chọn file ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewImage) URL.revokeObjectURL(previewImage);
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Hủy chọn file ảnh
  const handleRemoveImage = () => {
    if (previewImage) URL.revokeObjectURL(previewImage);
    setFormData((prev) => ({ ...prev, image: null }));
    setPreviewImage(null);
  };

  // Xử lý submit Form báo cáo
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và mô tả chi tiết.');
      return;
    }

    const { tenantId, roomId } = getUserInfo();

    if (!tenantId) {
      alert('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('tenantId', tenantId);

      // Gửi roomId nếu tìm thấy
      if (roomId) {
        data.append('roomId', roomId);
      }

      data.append('category', formData.category);
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('priority', formData.priority);

      if (formData.image) {
        data.append('image', formData.image);
      }

      await axiosClient.post('/repair-requests', data);

      alert('Gửi báo cáo sự cố thành công!');

      // Reset form
      handleRemoveImage();
      setFormData({
        category: 'ELECTRIC',
        title: '',
        description: '',
        priority: 'MEDIUM',
        image: null,
      });

      // Tải lại danh sách
      fetchRepairRequests();
    } catch (err) {
      console.error('Lỗi khi gửi báo cáo:', err);
      if (err.response?.status === 403) {
        alert('Lỗi 403: Không có quyền truy cập hoặc phiên làm việc đã hết hạn.');
      } else if (err.response?.status === 500) {
        alert('Lỗi Server (500): Hãy kiểm tra lại dữ liệu gửi lên hoặc cấu hình Backend.');
      } else {
        alert('Gửi báo cáo thất bại. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render nhãn Danh mục
  const renderCategoryLabel = (category) => {
    switch (category) {
      case 'ELECTRIC': return '⚡ Điện';
      case 'WATER': return '💧 Nước';
      case 'APPLIANCE': return '❄️ Điện lạnh';
      case 'FURNITURE': return '🪑 Nội thất';
      default: return '🛠️ Khác';
    }
  };

  // Render Badge Trạng thái
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i>Chờ tiếp nhận</span>;
      case 'IN_PROGRESS':
        return <span className="badge bg-primary"><i className="bi bi-gear-wide-connected me-1"></i>Đang sửa</span>;
      case 'COMPLETED':
        return <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Đã xong</span>;
      case 'REJECTED':
        return <span className="badge bg-secondary"><i className="bi bi-x-circle me-1"></i>Từ chối</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  // Render Badge Mức độ ưu tiên
  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <span className="text-danger fw-bold small">🔴 Gấp</span>;
      case 'MEDIUM': return <span className="text-warning fw-bold small">🟡 Bình thường</span>;
      case 'LOW': return <span className="text-info fw-bold small">🔵 Thấp</span>;
      default: return null;
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar bên trái */}
      <div className="d-print-none">
        <TenantSidebar />
      </div>

      {/* Nội dung chính bên phải */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold m-0 text-dark">🛠️ Báo Cáo Sửa Chữa & Sự Cố</h3>
          <button 
            className="btn btn-outline-primary btn-sm rounded-pill px-3" 
            onClick={fetchRepairRequests}
            disabled={isLoading}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${isLoading ? 'spin' : ''}`}></i> Tải lại
          </button>
        </div>

        <div className="row g-4">
          {/* CỘT 1: FORM KHAI BÁO SỰ CỐ */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-primary mb-3">Tạo yêu cầu mới</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Danh mục sự cố</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="ELECTRIC">⚡ Điện (Ổ cắm, cầu chì, bóng đèn...)</option>
                    <option value="WATER">💧 Nước (Rò rỉ, vòi nước, bồn cầu...)</option>
                    <option value="APPLIANCE">❄️ Thiết bị (Điều hòa, máy giặt, tủ lạnh...)</option>
                    <option value="FURNITURE">🪑 Nội thất & Cửa (Khóa cửa, bàn ghế...)</option>
                    <option value="OTHER">🛠️ Sự cố khác</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Mức độ ưu tiên</label>
                  <select
                    className="form-select"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="LOW">🔵 Thấp (Xử lý trong vài ngày)</option>
                    <option value="MEDIUM">🟡 Bình thường (Xử lý 24h - 48h)</option>
                    <option value="HIGH">🔴 Gấp (Ảnh hưởng trực tiếp sinh hoạt)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Tiêu đề sự cố</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    placeholder="Ví dụ: Vòi nước bồn rửa mặt bị rò rỉ"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Mô tả chi tiết</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="3"
                    placeholder="Mô tả cụ thể hiện trạng để kỹ thuật chuẩn bị dụng cụ..."
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Hình ảnh hiện trường (nếu có)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {previewImage && (
                    <div className="mt-2 text-center position-relative d-inline-block">
                      <img
                        src={previewImage}
                        alt="Preview sự cố"
                        className="img-thumbnail rounded-3"
                        style={{ maxHeight: '140px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle m-1"
                        style={{ padding: '0.1rem 0.4rem' }}
                        onClick={handleRemoveImage}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-3 fw-bold py-2 mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-1"></i> Gửi Yêu Cầu Sửa Chữa
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* CỘT 2: LỊCH SỬ VÀ TIẾN ĐỘ SỬA CHỮA */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-secondary mb-3">Lịch sử báo cáo & Tiến độ</h5>

              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted small">Đang tải lịch sử báo cáo...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-tools text-muted display-4 mb-2 d-block"></i>
                  <p className="text-muted">Chưa có lịch sử báo cáo sự cố nào.</p>
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: '650px' }}>
                  {requests.map((item) => (
                    <div key={item.id} className="card border rounded-3 p-3 mb-3 bg-light-subtle">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary-subtle text-dark border">
                            {renderCategoryLabel(item.category)}
                          </span>
                          {renderPriorityBadge(item.priority)}
                        </div>
                        <div>{renderStatusBadge(item.status)}</div>
                      </div>

                      <h6 className="fw-bold text-dark mb-1">{item.title}</h6>
                      <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-line' }}>
                        {item.description}
                      </p>

                      {/* Hiển thị hình ảnh đính kèm từ Supabase nếu có */}
                      {item.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt="Ảnh sự cố"
                            className="rounded-3 border"
                            style={{ height: '100px', width: 'auto', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setSelectedImage(getImageUrl(item.imageUrl))}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top small text-muted">
                        <span>
                          <i className="bi bi-calendar3 me-1"></i>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                        </span>
                        <span>Mã yêu cầu: #{item.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PHÓNG TO ẢNH */}
      {selectedImage && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-transparent border-0 text-center">
              <div className="modal-body position-relative p-0">
                <img 
                  src={selectedImage} 
                  alt="Ảnh sự cố phóng to" 
                  className="img-fluid rounded-3 shadow-lg" 
                  style={{ maxHeight: '80vh' }}
                />
                <button 
                  type="button" 
                  className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}