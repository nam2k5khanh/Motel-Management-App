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
    const storedUserId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user'))?.id;

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

    // Kiểm tra khớp mật khẩu mới
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
      // Gọi API PUT /users/{id}/change-password
      await axiosClient.put(`/users/${userId}/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setMsgPass({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      // Reset form mật khẩu
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
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">⚙️ Cài Đặt Tài Khoản</h3>

        <div className="row g-4">
          {/* ================= FORM THÔNG TIN CÁ NHÂN ================= */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold m-0 text-primary">
                  <i className="bi bi-person-badge-fill me-2"></i>Thông Tin Cá Nhân
                </h5>
              </div>
              <div className="card-body">
                {msgProfile.text && (
                  <div className={`alert alert-${msgProfile.type} py-2 mb-3`}>
                    {msgProfile.text}
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Đang tải thông tin...</p>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tên Đăng Nhập</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={profile.username}
                        disabled
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Họ và Tên (*)</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Số Điện Thoại</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Số CCCD/CMND</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.cccd}
                        onChange={(e) => setProfile({ ...profile, cccd: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Giới Tính</label>
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

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Liên Hệ Khẩn Cấp</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.emergencyContact}
                        onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Địa Chỉ</label>
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
                        className="btn btn-primary fw-bold px-4"
                        disabled={savingProfile || !userId}
                      >
                        {savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ================= FORM ĐỔI MẬT KHẨU ================= */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold m-0 text-danger">
                  <i className="bi bi-shield-lock-fill me-2"></i>Đổi Mật Khẩu
                </h5>
              </div>
              <div className="card-body">
                {msgPass.text && (
                  <div className={`alert alert-${msgPass.type} py-2 mb-3`}>
                    {msgPass.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Mật Khẩu Hiện Tại</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Mật Khẩu Mới</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Xác Nhận Mật Khẩu Mới</label>
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
                      className="btn btn-danger fw-bold px-4"
                      disabled={savingPass || !userId}
                    >
                      {savingPass ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}