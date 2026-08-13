import React, { useState, useEffect } from 'react';
import LandlordSidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';

// Danh sách ngân hàng phổ biến hỗ trợ VietQR
const VIETNAM_BANKS = [
  { code: 'MB', name: 'MBBank - Ngân hàng Quân Đội' },
  { code: 'VCB', name: 'Vietcombank - NTTM CP Ngoại Thương' },
  { code: 'ICB', name: 'VietinBank - NTCP Công Thương' },
  { code: 'BIDV', name: 'BIDV - NTCP Đầu tư và Phát triển' },
  { code: 'TCB', name: 'Techcombank - NTCP Kỹ Thương' },
  { code: 'ACB', name: 'ACB - NTCP Á Châu' },
  { code: 'VPB', name: 'VPBank - NTCP Việt Nam Thịnh Vượng' },
  { code: 'TPB', name: 'TPBank - NTCP Tiên Phong' },
  { code: 'STB', name: 'Sacombank - NTCP Sài Gòn Thương Tín' },
  { code: 'VAB', name: 'VietA Bank - NTCP Việt Á' },
];

export default function LandlordBankSettings() {
  const [bankData, setBankData] = useState({
    bankCode: 'MB',
    bankName: 'MBBank - Ngân hàng Quân Đội',
    accountNumber: '',
    accountHolder: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const landlordId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}')?.id;

  // 1. Tải thông tin ngân hàng hiện tại của Chủ trọ
  useEffect(() => {
    if (!landlordId) return;
    setLoading(true);
    axiosClient
      .get(`/landlord-bank/landlord/${landlordId}`) // Khớp đúng với GET @RequestMapping("/api/landlord-bank/landlord/{landlordId}")
      .then((res) => {
        if (res.data) {
          setBankData({
            bankCode: res.data.bankCode || 'MB',
            bankName: res.data.bankName || 'MBBank - Ngân hàng Quân Đội',
            accountNumber: res.data.accountNumber || '',
            accountHolder: res.data.accountHolder || '',
          });
        }
      })
      .catch((err) => {
        if (err.response && err.response.status !== 404) {
          console.warn('Lỗi khi tải thông tin ngân hàng:', err);
        }
      })
      .finally(() => setLoading(false));
  }, [landlordId]);

  // Xử lý khi chọn Ngân hàng
  const handleBankSelectChange = (e) => {
    const selectedCode = e.target.value;
    const selectedBank = VIETNAM_BANKS.find((b) => b.code === selectedCode);
    setBankData((prev) => ({
      ...prev,
      bankCode: selectedCode,
      bankName: selectedBank ? selectedBank.name : '',
    }));
  };

  // Xử lý thay đổi các input khác
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({
      ...prev,
      [name]: name === 'accountHolder' ? value.toUpperCase() : value,
    }));
  };

  // 2. Lưu/Cập nhật thông tin ngân hàng
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bankData.accountNumber || !bankData.accountHolder) {
      setMessage({ type: 'danger', text: 'Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Khớp đúng với PUT @RequestMapping("/api/landlord-bank/landlord/{landlordId}")
      await axiosClient.put(`/landlord-bank/landlord/${landlordId}`, bankData);
      setMessage({ type: 'success', text: 'Lưu thông tin tài khoản ngân hàng thành công!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Cập nhật thất bại. Vui lòng thử lại sau.' });
    } finally {
      setLoading(false);
    }
  };

  // Tạo URL VietQR demo để chủ trọ xem trước
  const previewQR = () => {
    if (!bankData.accountNumber || !bankData.bankCode) return null;
    const addInfo = encodeURIComponent('THANH TOAN TIEN TRO DEMO');
    const accountName = encodeURIComponent(bankData.accountHolder);
    return `https://img.vietqr.io/image/${bankData.bankCode}-${bankData.accountNumber}-compact2.png?amount=1000000&addInfo=${addInfo}&accountName=${accountName}`;
  };

  return (
    <div className="d-flex">
      <LandlordSidebar />

      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>
        <h3 className="fw-bold mb-4 text-dark">🏦 Cấu Hình Tài Khoản Ngân Hàng</h3>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        <div className="row g-4">
          {/* CỘT FORM NHẬP THÔNG TIN */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-primary mb-3">Thông Tin Ngân Hàng Nhận Tiền</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Ngân hàng</label>
                  <select
                    name="bankCode"
                    className="form-select"
                    value={bankData.bankCode}
                    onChange={handleBankSelectChange}
                  >
                    {VIETNAM_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Số tài khoản</label>
                  <input
                    type="text"
                    name="accountNumber"
                    className="form-control"
                    placeholder="VD: 0987654321"
                    value={bankData.accountNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Tên chủ tài khoản (Viết hoa không dấu)</label>
                  <input
                    type="text"
                    name="accountHolder"
                    className="form-control text-uppercase"
                    placeholder="VD: NGUYEN VAN A"
                    value={bankData.accountHolder}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary px-4 rounded-pill fw-bold" disabled={loading}>
                  {loading ? 'Đang lưu...' : '💾 Lưu cấu hình'}
                </button>
              </form>
            </div>
          </div>

          {/* CỘT PREVIEW MÃ QR DEMO */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
              <h5 className="fw-bold text-secondary mb-3">Xem Trước Mã VietQR</h5>
              {bankData.accountNumber && bankData.bankCode ? (
                <div>
                  <img
                    src={previewQR()}
                    alt="VietQR Demo"
                    className="img-fluid rounded-3 border shadow-sm p-2 mb-3 bg-white"
                    style={{ maxHeight: '250px' }}
                  />
                  <div className="small text-start bg-light p-3 rounded-3">
                    <p className="mb-1"><strong>Ngân hàng:</strong> {bankData.bankName}</p>
                    <p className="mb-1"><strong>Mã NH (VietQR):</strong> {bankData.bankCode}</p>
                    <p className="mb-1"><strong>STK:</strong> {bankData.accountNumber}</p>
                    <p className="mb-0"><strong>Chủ TK:</strong> {bankData.accountHolder}</p>
                  </div>
                </div>
              ) : (
                <div className="py-5 text-muted">
                  <i className="bi bi-qr-code-scan display-4 d-block mb-2"></i>
                  Vui lòng nhập đầy đủ Số tài khoản để xem trước mã QR.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}