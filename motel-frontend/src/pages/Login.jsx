import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/login', { username, password });
      const token = response.data.token || response.data.accessToken || response.data.jwt || response.data.jwtToken;
      const userId = response.data.userId || response.data.id || response.data.user?.id;
      if (!token) {
        console.error("Backend không trả về token trong response!");
      }
      // Lưu thông tin vào localStorage
      localStorage.setItem('token', token);
      console.log(token)
      localStorage.setItem('userId', userId);
      console.log(userId);

      localStorage.setItem('username', response.data.username);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('fullName', response.data.fullName);

      // Chuyển hướng trang tùy theo Role
      if (response.data.role === 'LANDLORD') {
        navigate('/landlord');
      } else if (response.data.role === 'MANAGER') {
        navigate('/manager');
      } else {
        navigate('/tenant');
      }
    } catch (err) {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-lg p-4" style={{ width: '400px', borderRadius: '15px' }}>
        <div className="text-center mb-4">
          <i className="bi bi-house-lock text-primary" style={{ fontSize: '3rem' }}></i>
          <h3 className="text-primary fw-bold mt-2">ĐĂNG NHẬP</h3>
        </div>

        {error && <div className="alert alert-danger py-2 text-center">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Tên đăng nhập</label>
            <input type="text" className="form-control" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Mật khẩu</label>
            <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary w-100 fw-bold py-2 mt-2" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
          </button>

          <div className="text-center mt-3">
            <span className="text-muted">Chưa có tài khoản? </span>
            <Link to="/register" className="fw-bold text-decoration-none">Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
}