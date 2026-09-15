import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import TenantSidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function TenantDashboard() {
  const [tenantInfo, setTenantInfo] = useState(null);
  const [activeMotelTenant, setActiveMotelTenant] = useState(null);
  const [motelTenantStatus, setMotelTenantStatus] = useState(null); // 'APPROVED' | 'PENDING' | null

  const [motelDetail, setMotelDetail] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);

  const [currentBill, setCurrentBill] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');

  const getUserId = () => {
    const storedId = localStorage.getItem('userId');
    if (storedId) return Number(storedId);

    const userObj = localStorage.getItem('user');
    if (userObj) {
      try { return Number(JSON.parse(userObj)?.id); } catch { return null; }
    }
    return null;
  };

  const fetchDashboardData = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      const [userRes, mtRes] = await Promise.allSettled([
        axiosClient.get(`/users/${userId}`),
        axiosClient.get(`/motel-tenants/user/${userId}`)
      ]);

      if (userRes.status === 'fulfilled') {
        setTenantInfo(userRes.value.data || {});
      }

      const mtList = (mtRes.status === 'fulfilled' && Array.isArray(mtRes.value.data)) 
        ? mtRes.value.data 
        : [];

      const approvedRecord = mtList.find((mt) => mt.status === 'APPROVED');
      const pendingRecord = mtList.find((mt) => mt.status === 'PENDING');
      const targetRecord = approvedRecord || pendingRecord;

      if (targetRecord) {
        setMotelTenantStatus(targetRecord.status);
        setActiveMotelTenant(targetRecord);

        let motelId = targetRecord.motelId || targetRecord.motel?.id;
        let roomId = targetRecord.roomId || targetRecord.room?.id;

        if (targetRecord.status === 'APPROVED') {
          try {
            const resContract = await axiosClient.get(`/contracts/tenant/${userId}/ACTIVE`);
            const contractData = resContract.data;
            
            if (contractData) {
              setContractInfo(contractData);
              const contractRoomId = contractData.room?.id || contractData.roomId || contractData.room_id;
              if (contractRoomId) roomId = contractRoomId;

              try {
                await axiosClient.get(`/contracts/landlord/${contractData.id}`);
              } catch (e) {
                console.warn('Không thể lấy thông tin Landlord qua Contract ID:', e);
              }
            }
          } catch (e) {
            console.warn('Người dùng chưa có hợp đồng ACTIVE:', e);
          }

          const [billRes, noticeRes] = await Promise.allSettled([
            axiosClient.get(`/invoices/latest/${userId}`),
            axiosClient.get(`/notifications/user/${userId}`),
          ]);

          if (billRes.status === 'fulfilled') setCurrentBill(billRes.value.data);
          if (noticeRes.status === 'fulfilled') setAnnouncements(noticeRes.value.data || []);
        }

        if (roomId) {
          try {
            const rRes = await axiosClient.get(`/rooms/${roomId}`);
            setRoomDetail(rRes.data);
            if (rRes.data?.motelId || rRes.data?.motel_id) {
              motelId = rRes.data.motelId || rRes.data.motel_id;
            }
          } catch (e) {
            console.error('Lỗi tải chi tiết phòng:', e);
          }
        } else if (targetRecord.room) {
          setRoomDetail(targetRecord.room);
        }

        if (motelId) {
          try {
            const mRes = await axiosClient.get(`/motels/${motelId}`);
            setMotelDetail(mRes.data);
          } catch (e) {
            console.error('Lỗi tải chi tiết nhà trọ:', e);
          }
        } else if (targetRecord.motel) {
          setMotelDetail(targetRecord.motel);
        }

      } else {
        setMotelTenantStatus(null);
        setActiveMotelTenant(null);
        setMotelDetail(null);
        setRoomDetail(null);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu trang chủ Tenant:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchDashboardData(userId);
    } else {
      setIsLoading(false);
    }
  }, [fetchDashboardData]);

  const handleJoinMotel = async (e) => {
    e.preventDefault();
    const cleanCode = inviteCodeInput.trim().toUpperCase();

    if (!cleanCode) {
      setCodeError('Vui lòng nhập mã mời dãy trọ!');
      return;
    }

    setIsSubmittingCode(true);
    setCodeError('');
    setCodeSuccess('');

    try {
      const currentUserId = getUserId();
      const res = await axiosClient.post('/motel-tenants/join', {
        tenantId: currentUserId,
        inviteCode: cleanCode,
      });

      setCodeSuccess(res.data?.message || 'Gửi yêu cầu tham gia thành công! Vui lòng chờ duyệt.');
      setInviteCodeInput('');
      await fetchDashboardData(currentUserId);
    } catch (err) {
      console.error('Lỗi khi gửi mã mời:', err);
      setCodeError(err.response?.data?.message || 'Mã mời không chính xác hoặc đã hết hạn!');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const getMotelName = () => {
    return (
      motelDetail?.name ||
      motelDetail?.motelName ||
      activeMotelTenant?.motel?.name ||
      activeMotelTenant?.motel?.motelName ||
      activeMotelTenant?.motelName ||
      tenantInfo?.motelName ||
      'Nhà Trọ'
    );
  };

  const getRoomName = () => {
    return (
      roomDetail?.roomCode ||
      roomDetail?.roomNumber ||
      roomDetail?.name ||
      contractInfo?.room?.roomCode ||
      activeMotelTenant?.room?.roomCode ||
      activeMotelTenant?.room?.roomNumber ||
      activeMotelTenant?.roomName ||
      tenantInfo?.roomName ||
      'Chưa xếp phòng'
    );
  };

  const getMotelAddress = () => {
    return (
      motelDetail?.address ||
      activeMotelTenant?.motel?.address ||
      activeMotelTenant?.address ||
      ''
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light w-100 overflow-x-hidden">
      {/* Mobile Navbar */}
      <header className="navbar navbar-dark bg-primary sticky-top px-3 shadow-sm d-lg-none" style={{ zIndex: 1030, height: '56px' }}>
        <div className="d-flex align-items-center w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-link text-white p-0 border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
              <i className="bi bi-list fs-3"></i>
            </button>
            <span className="navbar-brand fw-bold mb-0 me-0 fs-6">TRỌ CỦA TÔI</span>
          </div>
          <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            {tenantInfo?.fullName ? tenantInfo.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

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

      <div className="d-flex flex-grow-1 w-100">
        <TenantSidebar />

        <div className="main-content-area flex-grow-1 p-3 p-md-4 overflow-hidden">

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted small">Đang kiểm tra thông tin thuê trọ...</p>
            </div>
          ) : motelTenantStatus === 'PENDING' ? (
            <div className="row justify-content-center py-4 py-md-5 mx-0">
              <div className="col-12 col-md-8 col-lg-6 px-0 px-sm-2">
                <div className="card border-0 shadow-sm rounded-4 text-center p-3 p-md-4 bg-white">
                  <div className="mb-3">
                    <span className="fs-1 text-warning">⏳</span>
                  </div>
                  <h4 className="fw-bold text-dark mb-2 fs-5 fs-md-4">Đang Chờ Chủ Trọ Duyệt</h4>
                  <p className="text-muted small mb-2">
                    Bạn đã gửi yêu cầu gia nhập dãy trọ: <strong className="text-primary">{getMotelName()}</strong>
                  </p>
                  <p className="text-muted small mb-4">
                    Vui lòng liên hệ chủ trọ để được chấp nhận vào danh sách phòng.
                  </p>
                  <button
                    className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold w-100 w-sm-auto"
                    onClick={() => fetchDashboardData(getUserId())}
                  >
                    🔄 Kiểm Tra Trạng Thái Duyệt
                  </button>
                </div>
              </div>
            </div>
          ) : motelTenantStatus !== 'APPROVED' ? (
            <div className="row justify-content-center py-3 py-md-4 mx-0">
              <div className="col-12 col-md-8 col-lg-6 px-0 px-sm-2">
                <div className="card border-0 shadow-sm rounded-4 text-center p-3 p-md-4 bg-white">
                  <div className="mb-3">
                    <span className="fs-1 text-primary">🔑</span>
                  </div>
                  <h4 className="fw-bold text-dark mb-2 fs-5 fs-md-4">Bạn Chưa Gia Nhập Dãy Trọ Nào</h4>
                  <p className="text-muted small mb-4">
                    Vui lòng nhập <strong>Mã Mời</strong> do chủ trọ cung cấp để gửi yêu cầu gia nhập.
                  </p>

                  {codeError && (
                    <div className="alert alert-danger py-2 small text-start alert-dismissible fade show" role="alert">
                      ⚠️ {codeError}
                      <button type="button" className="btn-close py-2" onClick={() => setCodeError('')}></button>
                    </div>
                  )}

                  {codeSuccess && (
                    <div className="alert alert-success py-2 small text-start alert-dismissible fade show" role="alert">
                      ✅ {codeSuccess}
                      <button type="button" className="btn-close py-2" onClick={() => setCodeSuccess('')}></button>
                    </div>
                  )}

                  <form onSubmit={handleJoinMotel}>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control form-control-lg text-center font-monospace fw-bold border-primary text-uppercase"
                        placeholder="NHẬP MÃ MỜI (VD: MT1234)"
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        disabled={isSubmittingCode}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 fw-bold rounded-pill"
                      disabled={isSubmittingCode}
                    >
                      {isSubmittingCode ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Đang gửi...
                        </>
                      ) : (
                        '🚀 Xác Nhận Gia Nhập'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Banner */}
              <div className="card border-0 shadow-sm bg-primary text-white rounded-4 p-3 p-md-4 mb-3 mb-md-4">
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-8">
                    <span className="badge bg-light text-primary fw-bold mb-2 px-3 py-2 rounded-pill">
                      ĐANG THUÊ
                    </span>
                    <h2 className="fw-bold mb-2 fs-3 fs-md-2">Phòng {getRoomName()}</h2>
                    <p className="mb-0 text-white-50 small fs-md-6 text-truncate">
                      🏢 Nhà trọ: <strong className="text-white fw-bold">{getMotelName()}</strong>
                      {getMotelAddress() && ` - ${getMotelAddress()}`}
                    </p>
                  </div>
                  <div className="col-12 col-md-4 text-md-end">
                    <Link to="/tenant/contract" className="btn btn-light fw-bold text-primary rounded-pill px-4 w-100 w-md-auto">
                      Xem Hợp Đồng
                    </Link>
                  </div>
                </div>
              </div>

              {/* Grid Cards */}
              <div className="row g-3 g-md-4 mb-3 mb-md-4">
                {/* Hóa đơn - Sửa chỗ này để Badge không bị đè/tràn */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100 rounded-4">
                    <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                          <h6 className="fw-bold text-muted m-0 small text-uppercase">HÓA ĐƠN THÁNG NÀY</h6>
                          <span
                            className={`badge ${
                              currentBill?.status === 'PAID'
                                ? 'bg-success-subtle text-success'
                                : 'bg-danger-subtle text-danger'
                            } fw-bold px-2 py-1 rounded-pill text-nowrap`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {currentBill?.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </div>
                        <h3 className="fw-bold text-danger mb-2 fs-4 fs-md-3 text-truncate">
                          {currentBill?.total ? `${currentBill.total.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                        </h3>
                        <p className="text-muted small mb-1 text-truncate">
                          Nhà trọ: <strong>{getMotelName()}</strong>
                        </p>
                        <p className="text-muted small mb-3 text-truncate">
                          Hạn thanh toán: {currentBill?.dueDate || 'Chưa có thông báo'}
                        </p>
                      </div>
                      <Link to="/tenant/bills" className="btn btn-outline-primary w-100 fw-bold rounded-pill">
                        Chi Tiết Hóa Đơn
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Báo sự cố */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100 rounded-4">
                    <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-muted m-0 small text-uppercase">BÁO SỰ CỐ / SỬA CHỮA</h6>
                          <span className="fs-4 text-warning">⚠️</span>
                        </div>
                        <p className="text-muted mb-4 small">
                          Hỏng hóc trang thiết bị tại <strong>{getMotelName()}</strong>? Gửi yêu cầu ngay cho chủ trọ để xử lý.
                        </p>
                      </div>
                      <Link to="/tenant/issues" className="btn btn-warning text-dark w-100 fw-bold rounded-pill">
                        🛠️ Gửi Yêu Cầu Sửa Chữa
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Tài khoản */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100 rounded-4">
                    <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-muted m-0 small text-uppercase">TÀI KHOẢN CÁ NHÂN</h6>
                          <span className="fs-4 text-primary">⚙️</span>
                        </div>
                        <p className="text-muted mb-4 small">
                          Cập nhật thông tin cá nhân, số điện thoại hoặc đổi mật khẩu.
                        </p>
                      </div>
                      <Link to="/settings" className="btn btn-outline-secondary w-100 fw-bold rounded-pill">
                        Cài Đặt Tài Khoản
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông báo */}
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold m-0 text-primary fs-6 fs-md-5 text-truncate">
                    📢 Thông Báo Từ Chủ Trọ ({getMotelName()})
                  </h5>
                </div>
                <div className="card-body p-0">
                  {announcements.length > 0 ? (
                    <div className="list-group list-group-flush border-top">
                      {announcements.map((notice, index) => (
                        <div key={notice.id || index} className="list-group-item p-3">
                          <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
                            <h6 className="fw-bold m-0 text-dark fs-6 text-truncate">{notice.title}</h6>
                            <small className="text-muted text-nowrap" style={{ fontSize: '0.75rem' }}>{notice.createdDate}</small>
                          </div>
                          <p className="text-secondary small mb-0">{notice.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted border-top">
                      <p className="mb-0 small">Hiện chưa có thông báo mới nào từ chủ trọ.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}