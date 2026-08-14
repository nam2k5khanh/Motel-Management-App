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
      // 1. Tải thông tin User & Trạng thái Đăng ký Trọ
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

        // 2. Nếu đã APPROVED: Tải Hợp đồng -> Gọi API Landlord/Contract -> Lấy Room ID
        if (targetRecord.status === 'APPROVED') {
          try {
            const resContract = await axiosClient.get(`/contracts/tenant/${userId}/ACTIVE`);
            const contractData = resContract.data;
            
            if (contractData) {
              setContractInfo(contractData);

              // Lấy roomId từ contract object ( room_id hoặc room.id )
              const contractRoomId = contractData.room?.id || contractData.roomId || contractData.room_id;
              if (contractRoomId) roomId = contractRoomId;

              // Gọi API lấy landlordId thông qua contractId
              try {
                const landlordRes = await axiosClient.get(`/contracts/landlord/${contractData.id}`);
                console.log('Thông tin Landlord từ Contract:', landlordRes.data);
              } catch (e) {
                console.warn('Không thể lấy thông tin Landlord qua Contract ID:', e);
              }
            }
          } catch (e) {
            console.warn('Người dùng chưa có hợp đồng ACTIVE:', e);
          }

          // Tải Hóa đơn & Thông báo
          const [billRes, noticeRes] = await Promise.allSettled([
            axiosClient.get(`/invoices/latest/${userId}`),
            axiosClient.get(`/notifications/user/${userId}`),
          ]);

          if (billRes.status === 'fulfilled') setCurrentBill(billRes.value.data);
          if (noticeRes.status === 'fulfilled') setAnnouncements(noticeRes.value.data || []);
        }

        // 3. Tải thông tin chi tiết Phòng nếu có roomId
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

        // 4. Tải thông tin chi tiết Nhà trọ nếu có motelId
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
    <div className="d-flex">
      <TenantSidebar />

      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">🏠 Tổng Quan Phòng Trọ</h3>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Đang kiểm tra thông tin thuê trọ...</p>
          </div>
        ) : motelTenantStatus === 'PENDING' ? (
          /* TRƯỜNG HỢP 1: PENDING */
          <div className="row justify-content-center py-5">
            <div className="col-md-8 col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 text-center p-4 bg-white">
                <div className="mb-3">
                  <span className="fs-1 text-warning">⏳</span>
                </div>
                <h4 className="fw-bold text-dark mb-2">Đang Chờ Chủ Trọ Duyệt</h4>
                <p className="text-muted small mb-2">
                  Bạn đã gửi yêu cầu gia nhập dãy trọ: <strong className="text-primary">{getMotelName()}</strong>
                </p>
                <p className="text-muted small mb-4">
                  Vui lòng liên hệ chủ trọ để được chấp nhận vào danh sách phòng.
                </p>
                <button
                  className="btn btn-outline-primary btn-sm rounded-3 px-4 py-2 fw-bold"
                  onClick={() => fetchDashboardData(getUserId())}
                >
                  🔄 Kiểm Tra Trạng Thái Duyệt
                </button>
              </div>
            </div>
          </div>
        ) : motelTenantStatus !== 'APPROVED' ? (
          /* TRƯỜNG HỢP 2: NHẬP MÃ MỜI */
          <div className="row justify-content-center py-4">
            <div className="col-md-8 col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 text-center p-4">
                <div className="mb-3">
                  <span className="fs-1 text-primary">🔑</span>
                </div>
                <h4 className="fw-bold text-dark mb-2">Bạn Chưa Gia Nhập Dãy Trọ Nào</h4>
                <p className="text-muted small mb-4">
                  Vui lòng nhập <strong>Mã Mời</strong> do chủ trọ cung cấp để gửi yêu cầu gia nhập.
                </p>

                {codeError && (
                  <div className="alert alert-danger py-2 small text-start" role="alert">
                    ⚠️ {codeError}
                  </div>
                )}

                {codeSuccess && (
                  <div className="alert alert-success py-2 small text-start" role="alert">
                    ✅ {codeSuccess}
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
                    className="btn btn-primary btn-lg w-100 fw-bold rounded-3"
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
          /* TRƯỜNG HỢP 3: APPROVED */
          <>
            <div className="card border-0 shadow-sm bg-primary text-white rounded-4 p-4 mb-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <span className="badge bg-light text-primary fw-bold mb-2 px-3 py-2">
                    ĐANG THUÊ
                  </span>
                  <h2 className="fw-bold mb-2">Phòng {getRoomName()}</h2>
                  <p className="mb-0 text-white-50 fs-5">
                    🏢 Nhà trọ: <strong className="text-white fw-bold">{getMotelName()}</strong>
                    {getMotelAddress() && ` - ${getMotelAddress()}`}
                  </p>
                </div>
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <Link to="/tenant/contract" className="btn btn-light fw-bold text-primary rounded-3 px-4">
                    Xem Hợp Đồng
                  </Link>
                </div>
              </div>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 rounded-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-muted m-0">HÓA ĐƠN THÁNG NÀY</h6>
                      <span
                        className={`badge ${
                          currentBill?.status === 'PAID'
                            ? 'bg-success-subtle text-success'
                            : 'bg-danger-subtle text-danger'
                        } fw-bold px-3 py-1`}
                      >
                        {currentBill?.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    <h3 className="fw-bold text-danger mb-2">
                      {currentBill?.total ? `${currentBill.total.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                    </h3>
                    <p className="text-muted small mb-1">
                      Nhà trọ: <strong>{getMotelName()}</strong>
                    </p>
                    <p className="text-muted small mb-3">
                      Hạn thanh toán: {currentBill?.dueDate || 'Chưa có thông báo'}
                    </p>
                    <Link to="/tenant/bills" className="btn btn-outline-primary w-100 fw-bold rounded-3">
                      Chi Tiết Hóa Đơn
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 rounded-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-muted m-0">BÁO SỰ CỐ / SỬA CHỮA</h6>
                      <span className="fs-4 text-warning">⚠️</span>
                    </div>
                    <p className="text-muted mb-4 small">
                      Hỏng hóc trang thiết bị tại <strong>{getMotelName()}</strong>? Gửi yêu cầu ngay cho chủ trọ để xử lý.
                    </p>
                    <Link to="/tenant/issues" className="btn btn-warning text-dark w-100 fw-bold rounded-3">
                      🛠️ Gửi Yêu Cầu Sửa Chữa
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 rounded-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-muted m-0">TÀI KHOẢN CÁ NHÂN</h6>
                      <span className="fs-4 text-primary">⚙️</span>
                    </div>
                    <p className="text-muted mb-4 small">
                      Cập nhật thông tin cá nhân, số điện thoại hoặc đổi mật khẩu.
                    </p>
                    <Link to="/settings" className="btn btn-outline-secondary w-100 fw-bold rounded-3">
                      Cài Đặt Tài Khoản
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white py-3 border-0">
                <h5 className="fw-bold m-0 text-primary">📢 Thông Báo Từ Chủ Trọ ({getMotelName()})</h5>
              </div>
              <div className="card-body p-0">
                {announcements.length > 0 ? (
                  <div className="list-group list-group-flush border-top">
                    {announcements.map((notice, index) => (
                      <div key={notice.id || index} className="list-group-item p-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h6 className="fw-bold m-0 text-dark">{notice.title}</h6>
                          <small className="text-muted">{notice.createdDate}</small>
                        </div>
                        <p className="text-secondary small mb-0">{notice.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted border-top">
                    <p className="mb-0">Hiện chưa có thông báo mới nào từ chủ trọ.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}