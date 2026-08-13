import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import axiosClient from '../../api/axiosClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Đăng ký các module Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function StatisticsManagement() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [motels, setMotels] = useState([]);
  const [selectedMotelId, setSelectedMotelId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dữ liệu KPI tổng quan
  const [kpi, setKpi] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    totalRevenueYear: 0,
    unpaidCount: 0
  });

  // Dữ liệu biểu đồ
  const [monthlyRevenue, setMonthlyRevenue] = useState(Array(12).fill(0));
  const [invoiceStatus, setInvoiceStatus] = useState({ paid: 0, unpaid: 0 });

  const userId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchMotels();
  }, []);

  useEffect(() => {
    if (selectedMotelId) {
      fetchStatisticsData();
    }
  }, [selectedMotelId, selectedYear]);

  // 1. Lấy danh sách dãy trọ
  const fetchMotels = async () => {
    try {
      const res = await axiosClient.get(`/motels?userId=${userId}`);
      const list = res.data || [];
      setMotels(list);
      if (list.length > 0) setSelectedMotelId(list[0].id);
    } catch (err) {
      console.error('Lỗi lấy danh sách dãy trọ:', err);
    }
  };

  // 2. Tải dữ liệu thống kê dựa trên motelId & year
  const fetchStatisticsData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [resContracts, resInvoices] = await Promise.all([
        axiosClient.get(`/contracts/active/motel/${selectedMotelId}`).catch(() => ({ data: [] })),
        axiosClient.get(`/invoices?motelId=${selectedMotelId}&year=${selectedYear}`).catch(() => ({ data: [] }))
      ]);

      const contracts = resContracts.data || [];
      const invoices = resInvoices.data || [];

      // Tính tổng số hợp đồng đang hoạt động (Phòng đang thuê)
      const activeRoomsCount = contracts.length;

      // Xử lý doanh thu 12 tháng & trạng thái hóa đơn
      const revenue12Months = Array(12).fill(0);
      let yearTotal = 0;
      let paidCount = 0;
      let unpaidCount = 0;

      invoices.forEach(inv => {
        const m = (inv.month || 1) - 1; // 0..11
        const total = Number(inv.total || 0);

        if (inv.status === 'PAID') {
          revenue12Months[m] += total;
          yearTotal += total;
          paidCount++;
        } else {
          unpaidCount++;
        }
      });

      setKpi({
        totalRooms: activeRoomsCount,
        occupiedRooms: activeRoomsCount,
        totalRevenueYear: yearTotal,
        unpaidCount: unpaidCount
      });

      setMonthlyRevenue(revenue12Months);
      setInvoiceStatus({ paid: paidCount, unpaid: unpaidCount });

    } catch (err) {
      setErrorMessage('Không thể tải dữ liệu thống kê.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : '0 ₫';
  };

  // Cấu hình dữ liệu Biểu Đồ Cột (Doanh thu)
  const barChartData = {
    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    datasets: [
      {
        label: `Doanh Thu Thực Thu (VNĐ)`,
        data: monthlyRevenue,
        backgroundColor: 'rgba(13, 110, 253, 0.8)',
        borderColor: '#0d6efd',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  // Cấu hình dữ liệu Biểu Đồ Tròn (Trạng Thái Hóa Đơn)
  const pieChartData = {
    labels: ['Đã Thanh Toán', 'Chưa Thanh Toán'],
    datasets: [
      {
        data: [invoiceStatus.paid, invoiceStatus.unpaid],
        backgroundColor: ['#198754', '#dc3545'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="d-flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính thụt lề 260px khớp với Sidebar */}
      <div className="flex-grow-1 p-4 bg-light min-vh-100" style={{ marginLeft: '260px' }}>

        {/* Thanh tiêu đề và bộ lọc */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold mb-1">📈 Báo Cáo & Thống Kê</h3>
            <p className="text-muted m-0">Tổng quan doanh thu, hợp đồng và tình trạng thu tiền</p>
          </div>

          <div className="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm border">
            <select 
              className="form-select form-select-sm" 
              style={{ width: '160px' }}
              value={selectedMotelId} 
              onChange={e => setSelectedMotelId(e.target.value)}
            >
              {motels.map(m => (
                <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
              ))}
            </select>

            <select 
              className="form-select form-select-sm" 
              style={{ width: '95px' }}
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert-danger py-2 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
          </div>
        )}

        {/* 4 Thẻ KPI Thống Kê Nhanh */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm border-start border-primary border-4 p-3 bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Doanh Thu Năm {selectedYear}</span>
                  <h4 className="fw-bold text-primary mt-1 mb-0">{formatMoney(kpi.totalRevenueYear)}</h4>
                </div>
                <div className="fs-2 text-primary">
                  <i className="bi bi-cash-stack"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm border-start border-success border-4 p-3 bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Hợp Đồng Đang Thuê</span>
                  <h4 className="fw-bold text-success mt-1 mb-0">{kpi.occupiedRooms} phòng</h4>
                </div>
                <div className="fs-2 text-success">
                  <i className="bi bi-house-check"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm border-start border-danger border-4 p-3 bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Hóa Đơn Nợ Tiền</span>
                  <h4 className="fw-bold text-danger mt-1 mb-0">{kpi.unpaidCount} hóa đơn</h4>
                </div>
                <div className="fs-2 text-danger">
                  <i className="bi bi-exclamation-circle"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm border-start border-info border-4 p-3 bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Hóa Đơn Đã Thu</span>
                  <h4 className="fw-bold text-info mt-1 mb-0">{invoiceStatus.paid} hóa đơn</h4>
                </div>
                <div className="fs-2 text-info">
                  <i className="bi bi-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biểu Đồ Thống Kê */}
        <div className="row g-4">
          {/* Biểu đồ Doanh Thu 12 Tháng */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm p-4 bg-white h-100">
              <h5 className="fw-bold mb-4 text-dark">📊 Biểu Đồ Doanh Thu Theo Tháng (Năm {selectedYear})</h5>
              {isLoading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary me-2" role="status"></div>
                  Đang tải biểu đồ...
                </div>
              ) : (
                <div style={{ minHeight: '320px', position: 'relative' }}>
                  <Bar 
                    data={barChartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' }
                      }
                    }} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Biểu đồ Trạng Thái Hóa Đơn */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm p-4 bg-white h-100">
              <h5 className="fw-bold mb-4 text-dark">🍩 Trạng Thái Thu Hóa Đơn</h5>
              {isLoading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary me-2" role="status"></div>
                  Đang tải...
                </div>
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '280px' }}>
                  {invoiceStatus.paid === 0 && invoiceStatus.unpaid === 0 ? (
                    <div className="text-muted">Chưa có dữ liệu hóa đơn cho năm {selectedYear}</div>
                  ) : (
                    <Pie 
                      data={pieChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false 
                      }} 
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}