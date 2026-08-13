import React, { useEffect, useState, useRef } from 'react';
import axiosClient from '../api/axiosClient'; // Hoặc đường dẫn axiosClient của bạn

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Lấy ID người dùng từ localStorage
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Polling: Tự động cập nhật thông báo mới mỗi 10 giây
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosClient.get(`/notifications/user/${userId}`);
      setNotifications(res.data || []);
      const unread = (res.data || []).filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosClient.get(`/notifications/user/${userId}/unread-count`);
      setUnreadCount(res.data || 0);
    } catch (err) {
      console.error('Lỗi lấy số lượng chưa đọc:', err);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put(`/notifications/user/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi đánh dấu đọc tất cả:', err);
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* NÚT QUẢ CHUÔNG */}
      <button
        onClick={handleToggle}
        className="btn btn-light position-relative rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center"
        style={{ width: '42px', height: '42px' }}
      >
        <i className="bi bi-bell-fill fs-5 text-dark"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN DANH SÁCH THÔNG BÁO */}
      {isOpen && (
        <div
          className="card border-0 shadow-lg position-absolute end-0 mt-2 rounded-3"
          style={{ width: '360px', zIndex: 1050, maxHeight: '480px' }}
        >
          {/* HEADER */}
          <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between border-bottom">
            <h6 className="fw-bold m-0 text-dark">
              🔔 Thông Báo {unreadCount > 0 && <span className="badge bg-primary ms-1">{unreadCount} mới</span>}
            </h6>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn btn-link text-decoration-none p-0 small fw-semibold"
                style={{ fontSize: '0.8rem' }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* LIST ITEMS */}
          <div className="card-body p-0 overflow-auto" style={{ maxHeight: '380px' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-inbox fs-2 d-block mb-1 text-secondary"></i>
                Bạn không có thông báo nào.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                  className={`p-3 border-bottom cursor-pointer transition-all ${
                    !item.isRead ? 'bg-light border-start border-primary border-4' : 'bg-white'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-start justify-content-between mb-1">
                    <span className="fw-bold small text-dark">{item.title}</span>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </small>
                  </div>
                  <p className="text-secondary small m-0 text-break" style={{ fontSize: '0.825rem' }}>
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}