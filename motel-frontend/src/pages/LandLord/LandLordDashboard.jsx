import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function LandlordDashboard() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalRooms: 0,
    rentedRooms: 0,
    emptyRooms: 0
  });
  const [notifications, setNotifications] = useState([]); // State lưu danh sách thông báo
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Ưu tiên lấy userId chính xác từ localStorage
      const storedUserId = localStorage.getItem('userId');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUserId || storedUser.id || storedUser.userId || '1';

      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Gọi đồng thời Dashboard, Danh sách Dãy trọ và Danh sách Thông báo
      const [resDashboard, resMotels, resNotifications] = await Promise.allSettled([
        axiosClient.get(`/dashboard?userId=${userId}`).catch(() => axiosClient.get('/dashboard/summary')),
        axiosClient.get(`/motels?userId=${userId}`),
        axiosClient.get(`/notifications/user/${userId}`)
      ]);

      const dashboardData = resDashboard.status === 'fulfilled' ? resDashboard.value.data || {} : {};
      const motels = resMotels.status === 'fulfilled' ? resMotels.value.data || [] : [];
      const notifList = resNotifications.status === 'fulfilled' ? resNotifications.value.data || [] : [];

      setNotifications(notifList);

      let currentMonthRevenue = 0;

      if (motels.length > 0) {
        // Lấy hóa đơn tháng này của tất cả các dãy trọ
        const invoicePromises = motels.map(m =>
          axiosClient.get(`/invoices?motelId=${m.id}&month=${month}&year=${year}`).catch(() => ({ data: [] }))
        );
        const invoiceResults = await Promise.allSettled(invoicePromises);

        invoiceResults.forEach(res => {
          if (res.status === 'fulfilled') {
            const invoices = res.value.data || [];
            invoices.forEach(inv => {
              if (inv.status === 'PAID') {
                currentMonthRevenue += Number(inv.total || inv.totalAmount || 0);
              }
            });
          }
        });
      }

      // Cập nhật state thống kê
      setSummary({
        totalRevenue: currentMonthRevenue,
        totalRooms: dashboardData.totalRooms || 0,
        rentedRooms: dashboardData.rentedRooms || 0,
        emptyRooms: dashboardData.emptyRooms || 0
      });

    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const fillPercentage = summary.totalRooms > 0 
    ? Math.round((summary.rentedRooms / summary.totalRooms) * 100) 
    : 0;

  return (
    <div className="d-flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính thụt lề 260px khớp với Sidebar */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        
        {/* HEADER: Tiêu đề + Nút Cập nhật dữ liệu */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">🏠 Trang Chủ Quản Lý</h3>
            <p className="text-muted small m-0">
              Tổng quan tình hình kinh doanh tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </p>
          </div>

          {/* Nút Refresh dữ liệu */}
          <div>
            <button 
              className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1"
              onClick={fetchDashboardData}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> 
                  Đang tải...
                </span>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Cập nhật dữ liệu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* THỐNG KÊ TỔNG QUAN */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-primary text-white p-3 h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-white-50 fw-semibold text-uppercase">Doanh Thu Tháng Này</small>
                  <h3 className="fw-bold m-0 mt-2">{formatMoney(summary.totalRevenue)}</h3>
                </div>
                <div className="fs-1 opacity-50">💵</div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-success text-white p-3 h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-white-50 fw-semibold text-uppercase">Phòng Đang Ở</small>
                  <h3 className="fw-bold m-0 mt-2">{summary.rentedRooms} <small className="fs-6 fw-normal">phòng</small></h3>
                </div>
                <div className="fs-1 opacity-50">🔑</div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-warning text-dark p-3 h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-dark-50 fw-semibold text-uppercase">Phòng Trống</small>
                  <h3 className="fw-bold m-0 mt-2">{summary.emptyRooms} <small className="fs-6 fw-normal">phòng</small></h3>
                </div>
                <div className="fs-1 opacity-50">🚪</div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-info text-white p-3 h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-white-50 fw-semibold text-uppercase">Tổng Số Phòng</small>
                  <h3 className="fw-bold m-0 mt-2">{summary.totalRooms} <small className="fs-6 fw-normal">phòng</small></h3>
                </div>
                <div className="fs-1 opacity-50">🏢</div>
              </div>
            </div>
          </div>
        </div>

        {/* TỶ LỆ LẤP ĐẦY PHÒNG */}
        <div className="card border-0 shadow-sm p-4 mb-4">
          <h6 className="fw-bold mb-3 text-primary">📊 Tỷ Lệ Lấp Đầy Phòng</h6>
          {summary.totalRooms > 0 ? (
            <div>
              <div className="progress mb-2" style={{ height: '25px' }}>
                <div 
                  className="progress-bar bg-success fw-bold" 
                  role="progressbar" 
                  style={{ width: `${fillPercentage}%` }}
                >
                  {fillPercentage}%
                </div>
              </div>
              <div className="d-flex justify-content-between text-muted small fw-semibold">
                <span>Đã cho thuê: {summary.rentedRooms} / {summary.totalRooms} phòng</span>
                <span>Còn trống: {summary.emptyRooms} phòng</span>
              </div>
            </div>
          ) : (
            <p className="text-muted small m-0">Chưa có dữ liệu phòng trong hệ thống.</p>
          )}
        </div>

        {/* BẢNG THÔNG BÁO MỚI NHẤT */}
        <div className="card border-0 shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold m-0 text-primary d-flex align-items-center gap-2">
              <i className="bi bi-bell-fill text-warning"></i>
              Thông Báo Mới Nhất
            </h6>
            <span className="badge bg-primary-subtle text-primary fw-semibold">
              {notifications.length} thông báo
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-muted bg-light rounded-3">
              <i className="bi bi-inbox fs-3 d-block mb-1"></i>
              <small>Hiện chưa có thông báo mới nào.</small>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.slice(0, 5).map((notif, index) => (
                <div 
                  key={notif.id || index} 
                  className={`list-group-item list-group-item-action border-0 rounded-2 mb-2 p-3 ${
                    notif.isRead ? 'bg-light' : 'bg-white border-start border-4 border-primary shadow-sm'
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="me-2">
                      <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '0.95rem' }}>
                        {notif.title || notif.subject || 'Thông báo hệ thống'}
                      </h6>
                      <p className="text-muted small mb-0">
                        {notif.message || notif.content || 'Không có nội dung mô tả.'}
                      </p>
                    </div>
                    <small className="text-muted text-nowrap ms-2" style={{ fontSize: '0.75rem' }}>
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}