import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [motels, setMotels] = useState([]);

  const [selectedMotelId, setSelectedMotelId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const userId = Number(localStorage.getItem('userId')) || 1;

  useEffect(() => {
    fetchMotels();
  }, []);

  useEffect(() => {
    if (selectedMotelId) {
      fetchTenantsByMotel(selectedMotelId, selectedStatus);
    } else {
      fetchAllTenants();
    }
  }, [selectedMotelId, selectedStatus]);

  // 1. Tải danh sách Dãy trọ
  const fetchMotels = async () => {
    setIsFetching(true);
    try {
      const res = await axiosClient.get(`/motels?userId=${userId}`);
      const motelList = res.data || [];
      setMotels(motelList);
      if (motelList.length > 0) {
        setSelectedMotelId(motelList[0].id.toString());
      } else {
        setIsFetching(false);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách dãy trọ:', err);
      setIsFetching(false);
    }
  };

  // Hàm phụ trợ: Lấy thông tin User VÀ Hợp đồng
  const enrichTenantsWithUserData = async (motelTenantsList) => {
    if (!motelTenantsList || motelTenantsList.length === 0) return [];

    // CẢI TIẾN: Bỏ qua những khách thuê có status REMOVED từ tầng API response nếu có
    const activeTenantsOnly = motelTenantsList.filter(item => item.status !== 'REMOVED');

    const enrichedList = await Promise.all(
      activeTenantsOnly.map(async (item) => {
        const targetUserId = item.userId || item.tenantId || item.tenant?.id || item.user?.id;

        let userInfo = null;
        let contractInfo = null;

        if (targetUserId) {
          const [userRes, contractRes] = await Promise.allSettled([
            axiosClient.get(`/users/${targetUserId}`),
            axiosClient.get(`/contracts/tenant/${targetUserId}/ACTIVE`)
          ]);

          if (userRes.status === 'fulfilled') {
            userInfo = userRes.value.data;
          } else {
            console.error(`Lỗi khi lấy thông tin user #${targetUserId}:`, userRes.reason);
          }

          if (contractRes.status === 'fulfilled') {
            contractInfo = contractRes.value.data;
          } else {
            contractInfo = null;
          }
        }

        return {
          ...item,
          userInfo,
          contractInfo
        };
      })
    );

    return enrichedList;
  };

  // 2. Tải khách thuê theo Dãy trọ & Trạng thái
  const fetchTenantsByMotel = async (motelId, status) => {
    setIsFetching(true);
    try {
      const statusParam = status === 'ALL' ? '' : `?status=${status}`;
      const res = await axiosClient.get(`/motel-tenants/motel/${motelId}${statusParam}`);
      const rawList = res.data || [];

      const fullData = await enrichTenantsWithUserData(rawList);
      setTenants(fullData);
    } catch (err) {
      console.error('Lỗi khi tải danh sách khách thuê:', err);
      setTenants([]);
    } finally {
      setIsFetching(false);
    }
  };

  // Tải tất cả khách thuê
  const fetchAllTenants = async () => {
    setIsFetching(true);
    try {
      const res = await axiosClient.get('/tenants');
      const rawList = res.data || [];
      const fullData = await enrichTenantsWithUserData(rawList);
      setTenants(fullData);
    } catch (err) {
      console.error('Lỗi khi tải tất cả khách thuê:', err);
    } finally {
      setIsFetching(false);
    }
  };

  // 3. Xử lý Phê Duyệt
  const handleApprove = async (id, tenantName) => {
    if (!window.confirm(`Xác nhận PHÊ DUYỆT cho khách thuê "${tenantName}"?`)) return;

    setProcessingId(id);
    try {
      await axiosClient.put(`/motel-tenants/${id}/approve`);
      alert(`Đã phê duyệt thành công cho: ${tenantName}`);
      refreshData();
    } catch (err) {
      console.error('Lỗi khi duyệt khách thuê:', err);
      alert('Thao tác thất bại: ' + (err.response?.data?.message || 'Có lỗi xảy ra!'));
    } finally {
      setProcessingId(null);
    }
  };

  // 4. Xử lý Từ Chối
  const handleReject = async (id, tenantName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn TỪ CHỐI yêu cầu của "${tenantName}"?`)) return;

    setProcessingId(id);
    try {
      await axiosClient.put(`/motel-tenants/${id}/reject`);
      alert(`Đã từ chối yêu cầu của: ${tenantName}`);
      refreshData();
    } catch (err) {
      console.error('Lỗi khi từ chối khách thuê:', err);
      alert('Thao tác thất bại: ' + (err.response?.data?.message || 'Có lỗi xảy ra!'));
    } finally {
      setProcessingId(null);
    }
  };

  // 5. Xử lý Xóa Khách Thuê (Soft Delete - Cập nhật status = REMOVED)
  const handleDeleteTenant = async (id, tenantName) => {
    if (!window.confirm(`Xác nhận GỠ khách thuê "${tenantName}" khỏi dãy trọ?\n(Hành động này sẽ ẩn khách khỏi danh sách nhưng giữ lại dữ liệu lịch sử đối soát)`)) return;

    setProcessingId(id);
    try {
      await axiosClient.delete(`/motel-tenants/${id}`);
      alert(`Đã gỡ khách thuê "${tenantName}" khỏi nhà trọ.`);
      refreshData();
    } catch (err) {
      console.error('Lỗi khi xóa khách thuê:', err);
      alert('Không thể xóa: ' + (err.response?.data?.message || 'Có lỗi xảy ra!'));
    } finally {
      setProcessingId(null);
    }
  };

  const refreshData = () => {
    if (selectedMotelId) {
      fetchTenantsByMotel(selectedMotelId, selectedStatus);
    } else {
      fetchAllTenants();
    }
  };

  const currentMotel = motels.find(m => m.id === Number(selectedMotelId));
  const inviteCode = currentMotel?.inviteCode || currentMotel?.code;

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // LỌC DANH SÁCH: Bỏ qua hoàn toàn các người dùng có status === 'REMOVED'
  const filteredTenants = tenants.filter(t => {
    if (t.status === 'REMOVED') return false; // 👉 Bỏ qua nếu là REMOVED

    const user = t.userInfo || {};
    const name = (user.fullName || user.name || user.username || '').toLowerCase();
    const phone = (user.phone || user.phoneNumber || '').toLowerCase();
    const cccd = (user.cccd || user.identityCard || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return name.includes(search) || phone.includes(search) || cccd.includes(search);
  });

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4">👥 Quản Lý Khách Thuê & Duyệt Yêu Cầu</h3>

        {/* KHUNG CHỌN DÃY TRỌ & MÃ MỜI */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row align-items-center g-3">
              <div className="col-md-5">
                <label className="fw-bold text-dark mb-2 d-flex align-items-center">
                  <i className="bi bi-house-door-fill text-primary me-2"></i>
                  Chọn Dãy Trọ:
                </label>
                <select
                  className="form-select form-select-lg fw-semibold border-primary"
                  value={selectedMotelId}
                  onChange={e => setSelectedMotelId(e.target.value)}
                >
                  <option value="">-- Tất cả dãy trọ --</option>
                  {motels.map(m => (
                    <option key={m.id} value={m.id}>
                      🏠 {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-7">
                {currentMotel ? (
                  <div className="p-3 bg-white border border-primary-subtle rounded-3 shadow-sm d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block fw-semibold text-uppercase">Mã Mời Gia Nhập:</small>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="fs-4 fw-bold text-primary font-monospace bg-light px-3 py-1 rounded border">
                          <i className="bi bi-key-fill text-warning me-2"></i>
                          {inviteCode || 'Chưa có mã'}
                        </span>
                        {inviteCode && (
                          <button
                            className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-primary'}`}
                            onClick={() => handleCopyCode(inviteCode)}
                          >
                            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                            {copied ? ' Đã chép' : ' Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Địa chỉ dãy trọ:</small>
                      <span className="fw-semibold text-dark">{currentMotel.address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-light border rounded-3 text-muted text-center">
                    <i className="bi bi-info-circle me-2"></i>
                    Vui lòng chọn 1 dãy trọ để hiển thị Mã Mời
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG HIỂN THỊ */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <div className="row align-items-center g-3">
              <div className="col-md-4">
                <h5 className="fw-bold m-0">Danh Sách Khách Thuê ({filteredTenants.length})</h5>
              </div>

              {/* Bộ Lọc Trạng Thái */}
              <div className="col-md-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold text-nowrap small text-muted">Trạng thái:</span>
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                  >
                    <option value="ALL">🌐 Tất cả trạng thái</option>
                    <option value="PENDING">⏳ Chờ duyệt (PENDING)</option>
                    <option value="APPROVED">✅ Đã duyệt (APPROVED)</option>
                    <option value="REJECTED">❌ Từ chối (REJECTED)</option>
                  </select>
                </div>
              </div>

              {/* Ô Tìm Kiếm */}
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="🔍 Tìm tên, SĐT, CCCD..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Họ và Tên</th>
                    <th>Số Điện Thoại</th>
                    <th>CCCD</th>
                    <th>Phòng Được Gán (Tên HĐ)</th>
                    <th className="text-center">Thao Tác Duyệt</th>
                    <th className="text-center">Quản Lý</th>
                  </tr>
                </thead>
                <tbody>
                  {isFetching ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status"></div>
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        Chưa có khách thuê nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(item => {
                      const tenantId = item.id;
                      const status = item.status || 'APPROVED';

                      const user = item.userInfo || {};
                      const fullName = user.fullName || user.name || user.username || 'Đang tải / Chưa có';
                      const phone = user.phone || user.phoneNumber || '---';
                      const cccd = user.cccd || user.identityCard || '---';

                      const contract = item.contractInfo;
                      const roomName =
                        contract?.room?.roomCode ||
                        contract?.room?.name ||
                        contract?.roomNumber ||
                        contract?.roomCode ||
                        item.room?.roomCode ||
                        'Chưa gán phòng';

                      const hasActiveContract = Boolean(contract);

                      return (
                        <tr key={tenantId}>
                          <td className="fw-bold text-primary">{fullName}</td>
                          <td>{phone}</td>
                          <td>{cccd}</td>
                          <td className="fw-semibold text-secondary">
                            <i className="bi bi-door-closed me-1"></i>
                            {roomName}
                            {contract && (
                              <span className="badge bg-info-subtle text-info ms-2 small">
                                Hợp đồng: {contract.contractNumber || contract.id}
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            {status === 'PENDING' ? (
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  className="btn btn-sm btn-success fw-bold px-3"
                                  disabled={processingId === tenantId}
                                  onClick={() => handleApprove(tenantId, fullName)}
                                >
                                  {processingId === tenantId ? '...' : 'Duyệt'}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger fw-bold px-3"
                                  disabled={processingId === tenantId}
                                  onClick={() => handleReject(tenantId, fullName)}
                                >
                                  {processingId === tenantId ? '...' : 'Từ chối'}
                                </button>
                              </div>
                            ) : status === 'APPROVED' ? (
                              <span className="badge bg-success-subtle text-success border border-success px-2 py-1">
                                ✅ Đã Duyệt
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger px-2 py-1">
                                ❌ Đã Từ Chối
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            {hasActiveContract ? (
                              <span 
                                className="text-muted small italic" 
                                title="Không thể xóa khách đang có hợp đồng hoạt động"
                              >
                                <i className="bi bi-lock-fill me-1"></i>Đang thuê
                              </span>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title="Xóa khỏi nhà trọ"
                                disabled={processingId === tenantId}
                                onClick={() => handleDeleteTenant(tenantId, fullName)}
                              >
                                {processingId === tenantId ? (
                                  '...'
                                ) : (
                                  <>
                                    <i className="bi bi-trash me-1"></i>Xóa
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}