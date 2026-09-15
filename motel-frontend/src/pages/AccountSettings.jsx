import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axiosClient from '../api/axiosClient';

export default function AccountSettings() {
  // --- STATE THÔNG TIN CÁ NHÂN ---
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    cccd: '',
    gender: 'NAM',
    emergencyContact: ''
  });

  // --- STATE ĐỔI MẬT KHẨU ---
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Thông báo phản hồi
  const [msgProfile, setMsgProfile] = useState({ type: '', text: '' });
  const [msgPass, setMsgPass] = useState({ type: '', text: '' });

  useEffect(() => {
    // 1. Lấy userId từ localStorage khi component render
    const storedUserId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}')?.id;

    if (storedUserId) {
      setUserId(storedUserId);
      fetchUserData(storedUserId);
    } else {
      setIsLoading(false);
      setMsgProfile({ type: 'danger', text: 'Không tìm thấy ID người dùng. Vui lòng đăng nhập lại!' });
    }
  }, []);

  // 2. Lấy thông tin user từ API
  const fetchUserData = async (id) => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get(`/users/${id}`);
      if (res.data) {
        setProfile({
          username: res.data.username || '',
          fullName: res.data.fullName || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
          cccd: res.data.cccd || '',
          gender: res.data.gender || 'NAM',
          emergencyContact: res.data.emergencyContact || ''
        });
      }
    } catch (err) {
      console.error('Lỗi lấy thông tin người dùng:', err);
      setMsgProfile({ type: 'danger', text: 'Không thể tải thông tin người dùng!' });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Xử lý Cập nhật thông tin cá nhân
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setSavingProfile(true);
    setMsgProfile({ type: '', text: '' });

    try {
      await axiosClient.put(`/users/${userId}`, profile);
      setMsgProfile({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' });
    } catch (err) {
      console.error('Lỗi cập nhật profile:', err);
      setMsgProfile({
        type: 'danger',
        text: err.response?.data?.message || 'Không thể cập nhật thông tin!'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // 4. Xử lý Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setMsgPass({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMsgPass({ type: 'danger', text: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMsgPass({ type: 'danger', text: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
      return;
    }

    setSavingPass(true);
    try {
      await axiosClient.put(`/users/${userId}/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setMsgPass({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);
      setMsgPass({
        type: 'danger',
        text: err.response?.data?.message || 'Đổi mật khẩu thất bại! Kiểm tra lại mật khẩu hiện tại.'
      });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header Mobile - Hiển thị trên màn hình nhỏ < 992px */}
      <header className="navbar navbar-dark bg-primary sticky-top px-3 shadow-sm d-lg-none" style={{ zIndex: 1030, height: '56px' }}>
        <div className="d-flex align-items-center w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-link text-white p-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
              <i className="bi bi-list fs-3"></i>
            </button>
            <span className="navbar-brand fw-bold mb-0 me-0 fs-5">TÀI KHOẢN</span>
          </div>
          <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            U
          </div>
        </div>
      </header>

      {/* Style Responsive cho phần Sidebar & Nội dung */}
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

          <div className="row g-4">
            {/* ================= FORM THÔNG TIN CÁ NHÂN ================= */}
            <div className="col-12 col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold m-0 text-primary fs-6 fs-md-5">
                    <i className="bi bi-person-badge-fill me-2"></i>Thông Tin Cá Nhân
                  </h5>
                </div>
                <div className="card-body p-3 p-md-4 pt-0">
                  {msgProfile.text && (
                    <div className={`alert alert-${msgProfile.type} alert-dismissible fade show py-2 mb-3`} role="alert">
                      {msgProfile.text}
                      <button type="button" className="btn-close" onClick={() => setMsgProfile({ type: '', text: '' })}></button>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="mt-2 text-muted small">Đang tải thông tin...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Tên Đăng Nhập</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={profile.username}
                          disabled
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Họ và Tên (*)</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={profile.fullName}
                          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Số Điện Thoại</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Số CCCD/CMND</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.cccd}
                          onChange={(e) => setProfile({ ...profile, cccd: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small">Giới Tính</label>
                        <select
                          className="form-select"
                          value={profile.gender}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                        >
                          <option value="NAM">Nam</option>
                          <option value="NU">Nữ</option>
                          <option value="KHAC">Khác</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold small">Liên Hệ Khẩn Cấp</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.emergencyContact}
                          onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold small">Địa Chỉ</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.address}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        />
                      </div>

                      <div className="col-12 text-end mt-4">
                        <button
                          type="submit"
                          className="btn btn-primary fw-bold px-4 w-100 w-sm-auto rounded-pill"
                          disabled={savingProfile || !userId}
                        >
                          {savingProfile ? 'Đang lưu...' : '💾 Lưu Thay Đổi'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* ================= FORM ĐỔI MẬT KHẨU ================= */}
            <div className="col-12 col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold m-0 text-danger fs-6 fs-md-5">
                    <i className="bi bi-shield-lock-fill me-2"></i>Đổi Mật Khẩu
                  </h5>
                </div>
                <div className="card-body p-3 p-md-4 pt-0">
                  {msgPass.text && (
                    <div className={`alert alert-${msgPass.type} alert-dismissible fade show py-2 mb-3`} role="alert">
                      {msgPass.text}
                      <button type="button" className="btn-close" onClick={() => setMsgPass({ type: '', text: '' })}></button>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Mật Khẩu Hiện Tại</label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Mật Khẩu Mới</label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Xác Nhận Mật Khẩu Mới</label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      />
                    </div>

                    <div className="col-12 text-end mt-4">
                      <button
                        type="submit"
                        className="btn btn-danger fw-bold px-4 w-100 w-sm-auto rounded-pill"
                        disabled={savingPass || !userId}
                      >
                        {savingPass ? 'Đang cập nhật...' : '🔒 Đổi Mật Khẩu'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}