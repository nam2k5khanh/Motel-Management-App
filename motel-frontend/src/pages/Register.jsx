import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    cccd: '',
    gender: 'NAM',
    emergencyContact: '',
    role: 'LANDLORD' // Mặc định là Chủ trọ
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axiosClient.post('/auth/register', formData);
      alert('Đăng ký tài khoản thành công! Hãy đăng nhập.');
      navigate('/login');
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      // Hiển thị thông báo lỗi từ backend
      const errorMsg = err.response?.data?.message || err.response?.data || 'Đăng ký thất bại. Vui lòng thử lại!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-4">
      <div className="card shadow-lg p-4" style={{ width: '650px', borderRadius: '15px' }}>
        <h3 className="text-center text-primary fw-bold mb-3">ĐĂNG KÝ TÀI KHOẢN</h3>

        {error && <div className="alert alert-danger py-2 text-center">{error}</div>}

        <form onSubmit={handleRegister} className="row g-3">
          {/* Tên đăng nhập & Mật khẩu */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Tên đăng nhập (*)</label>
            <input
              type="text"
              name="username"
              className="form-control"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="VD: nguyenvana"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Mật khẩu (*)</label>
            <input
              type="password"
              name="password"
              className="form-control"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
            />
          </div>

          {/* Họ tên & Giới tính */}
          <div className="col-md-8">
            <label className="form-label fw-semibold">Họ và tên (*)</label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Giới tính</label>
            <select
              name="gender"
              className="form-select"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="NAM">Nam</option>
              <option value="NU">Nữ</option>
              <option value="KHAC">Khác</option>
            </select>
          </div>

          {/* Số điện thoại & Email */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Số điện thoại</label>
            <input
              type="text"
              name="phone"
              className="form-control"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>

          {/* CCCD & Liên hệ khẩn cấp */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Số CCCD/CMND</label>
            <input
              type="text"
              name="cccd"
              className="form-control"
              value={formData.cccd}
              onChange={handleChange}
              placeholder="VD: 012345678901"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">SĐT Liên hệ khẩn cấp</label>
            <input
              type="text"
              name="emergencyContact"
              className="form-control"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="SĐT người thân..."
            />
          </div>

          {/* Địa chỉ */}
          <div className="col-12">
            <label className="form-label fw-semibold">Địa chỉ thường trú / Quê quán</label>
            <input
              type="text"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
              placeholder="Số nhà, Đường, Phường/Xã, Tỉnh/Thành phố..."
            />
          </div>

          {/* Vai trò tài khoản */}
          <div className="col-12">
            <label className="form-label fw-semibold">Bạn là:</label>
            <select
              name="role"
              className="form-select fw-bold text-primary"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="LANDLORD">🏠 Chủ trọ (Toàn quyền quản trị)</option>
              <option value="MANAGER">👔 Quản lý (Quản lý vận hành & Điện nước)</option>
              <option value="TENANT">👤 Khách thuê (Người ở trọ)</option>
            </select>
          </div>

          {/* Nút Đăng ký */}
          <div className="col-12 mt-4">
            <button
              type="submit"
              className="btn btn-primary w-100 fw-bold py-2"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ TÀI KHOẢN'}
            </button>
          </div>

          <div className="col-12 text-center mt-3">
            <span className="text-muted">Đã có tài khoản? </span>
            <Link to="/login" className="fw-bold text-decoration-none">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}