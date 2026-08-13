import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  // 1. Lấy thông tin user và role từ localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = (localStorage.getItem('role') || user.role || 'TENANT').toUpperCase();
  const userName = user.fullName || user.username || localStorage.getItem('username') || 'Người dùng';

  // 2. Định nghĩa Menu cho từng vai trò
  const menus = {
    LANDLORD: [
      { title: 'Tổng Quan', path: '/landlord', icon: 'bi-grid-1x2-fill', exact: true },
      { title: 'Dãy Trọ', path: '/motelmanagement', icon: 'bi-buildings-fill' },
      { title: 'Phòng Trọ', path: '/roommanagement', icon: 'bi-house-door-fill' },
      { title: 'Khách Thuê', path: '/tenantmanagement', icon: 'bi-person-badge-fill' },
      { title: 'Hợp Đồng', path: '/contractmanagement', icon: 'bi-file-earmark-text-fill' },
      { title: 'Điện Nước', path: '/utilitymanagement', icon: 'bi-lightning-charge-fill' },
      { title: 'Hóa Đơn', path: '/invoicemanagement', icon: 'bi-receipt-cutoff' },
      { title: 'Thống Kê', path: '/statistics', icon: 'bi-bar-chart-line-fill' },
      { title: 'Tiếp Nhận Sửa Chữa', path: '/repair', icon: 'bi-tools' },
      { title: 'Tài Khoản Manager', path: '/managers', icon: 'bi-people-fill' },
      { title: 'Cài Đặt Ngân Hàng', path: '/bankSettings', icon: 'bi-credit-card-2-front-fill' },
      { title: 'Cài Đặt Tài Khoản', path: '/settings', icon: 'bi-gear-fill' },
    ],
    MANAGER: [
      { title: 'Tổng Quan', path: '/manager', icon: 'bi-grid-1x2-fill', exact: true },
      { title: 'Quản Lý Phòng', path: '/manager/rooms', icon: 'bi-house-door-fill' },
      { title: 'Khách Thuê', path: '/manager/tenants', icon: 'bi-person-badge-fill' },
      { title: 'Chỉ Số Điện Nước', path: '/manager/electricitywater', icon: 'bi-lightning-charge-fill' },
      { title: 'Lập & Thu Hóa Đơn', path: '/manager/invoices', icon: 'bi-receipt-cutoff' },
      { title: 'Báo Cáo Thống Kê', path: '/manager/statistics', icon: 'bi-bar-chart-line-fill' },
      { title: 'Cài Đặt Tài Khoản', path: '/settings', icon: 'bi-gear-fill' },
    ],
    TENANT: [
      { title: 'Trang Chủ', path: '/tenant', icon: 'bi-speedometer2', exact: true },
      { title: 'Hợp Đồng Thuê', path: '/tenant/contract', icon: 'bi-file-earmark-text' },
      { title: 'Hóa Đơn & Thanh Toán', path: '/tenant/bills', icon: 'bi-receipt' },
      { title: 'Báo Sự Cố / Sửa Chữa', path: '/tenant/issues', icon: 'bi-exclamation-triangle' },
      { title: 'Cài Đặt Tài Khoản', path: '/settings', icon: 'bi-gear' },
    ],
  };

  const currentMenu = menus[userRole] || menus.TENANT;

  const roleConfig = {
    LANDLORD: { title: 'CHỦ TRỌ', icon: 'bi-building-gear', badgeClass: 'text-warning' },
    MANAGER: { title: 'QUẢN LÝ TRỌ', icon: 'bi-person-gear', badgeClass: 'text-info' },
    TENANT: { title: 'TRỌ CỦA TÔI', icon: 'bi-house-heart', badgeClass: 'text-success' },
  }[userRole] || { title: 'KHÁCH THUÊ', icon: 'bi-house', badgeClass: 'text-success' };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div
      className="d-flex flex-column text-white shadow"
      style={{
        width: '260px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: '#1e293b',
      }}
    >
      {/* Khai báo style custom thanh cuộn riêng cho Sidebar */}
      <style>{`
        .custom-sidebar-scroll {
          overflow-y: auto;
          min-height: 0;
        }
        /* Độ rộng thanh cuộn */
        .custom-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        /* Rãnh chứa thanh cuộn */
        .custom-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        /* Tay cầm thanh cuộn */
        .custom-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        /* Thay đổi màu khi rê chuột vào thanh cuộn */
        .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>

      {/* 1. HEADER (Cố định phía trên) */}
      <div className="p-3 pb-0 flex-shrink-0">
        <div className="d-flex align-items-center mb-2 px-2 py-2 border-bottom border-secondary w-100">
          <i className={`bi ${roleConfig.icon} fs-4 text-primary me-2`}></i>
          <span className="fs-5 fw-bold tracking-wide text-primary">{roleConfig.title}</span>
        </div>

        {/* Thông tin người dùng tóm tắt */}
        <div className="d-flex align-items-center my-2 px-2 py-2 bg-secondary bg-opacity-25 rounded-3">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-2"
            style={{ width: '38px', height: '38px', minWidth: '38px' }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="text-truncate">
            <div className="fw-bold text-white small text-truncate">{userName}</div>
            <small className={`${roleConfig.badgeClass} fw-semibold`} style={{ fontSize: '0.75rem' }}>
              ● {userRole === 'LANDLORD' ? 'Chủ nhà' : userRole === 'MANAGER' ? 'Quản lý' : 'Khách thuê'}
            </small>
          </div>
        </div>
      </div>

      {/* 2. BODY (Có custom scrollbar mỏng đẹp) */}
      <div className="flex-grow-1 px-3 py-2 custom-sidebar-scroll">
        <ul className="nav nav-pills flex-column gap-1">
          {currentMenu.map((item, index) => (
            <li key={index} className="nav-item">
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 py-2 px-3 rounded ${
                    isActive ? 'active bg-primary fw-bold shadow-sm text-white' : 'text-white-50 hover-bg-light'
                  }`
                }
              >
                <i className={`bi ${item.icon} fs-5`}></i>
                <span className="small">{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. FOOTER (Cố định ở đáy Sidebar) */}
      <div className="p-3 border-top border-secondary flex-shrink-0 bg-dark">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-2"
        >
          <i className="bi bi-box-arrow-right fs-5"></i>
          <span>Đăng Xuất</span>
        </button>
      </div>
    </div>
  );
}