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
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: `Doanh Thu (VNĐ)`,
        data: monthlyRevenue,
        backgroundColor: 'rgba(13, 110, 253, 0.8)',
        borderColor: '#0d6efd',
        borderWidth: 1,
        borderRadius: 4,
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
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header Mobile - Chỉ hiện trên màn hình < 992px */}
      <header className="navbar navbar-dark bg-primary sticky-top px-3 shadow-sm d-lg-none" style={{ zIndex: 1030, height: '56px' }}>
        <div className="d-flex align-items-center w-100 justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-link text-white p-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas">
              <i className="bi bi-list fs-3"></i>
            </button>
            <span className="navbar-brand fw-bold mb-0 me-0 fs-5">CHỦ TRỌ</span>
          </div>
          <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            N
          </div>
        </div>
      </header>

      {/* Responsive Style cho Sidebar & Container */}
      <style>{`
        .main-content-area {
          margin-left: 0 !important;
          width: 100% !important;
        }
        @media (min-width: 992px) {
          .main-content-area {
            margin-left: 260px !important;
            width: calc(100% - 260px) !important;
          }
        }
      `}</style>

      {/* Main Container Layout */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar Component */}
        <Sidebar />

        {/* Nội dung chính */}
        <div className="main-content-area flex-grow-1 p-3 p-md-4">

          {/* Thanh tiêu đề và bộ lọc */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 mb-md-4 gap-2">

            {/* Bộ lọc Dãy Trọ & Năm */}
            <div className="d-flex flex-wrap gap-2 align-items-center bg-white p-2 rounded shadow-sm border align-self-start align-self-sm-center">
              <select 
                className="form-select form-select-sm" 
                style={{ width: '130px' }}
                value={selectedMotelId} 
                onChange={e => setSelectedMotelId(e.target.value)}
              >
                {motels.map(m => (
                  <option key={m.id} value={m.id}>{m.name || `Dãy #${m.id}`}</option>
                ))}
              </select>

              <select 
                className="form-select form-select-sm" 
                style={{ width: '90px' }}
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
            <div className="alert alert-danger py-2 mb-3 small" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {errorMessage}
            </div>
          )}

          {/* 4 Thẻ KPI Thống Kê Nhanh */}
          <div className="row g-2 g-md-3 mb-4">
            <div className="col-6 col-xl-3">
              <div className="card border-0 shadow-sm border-start border-primary border-4 p-2 p-md-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '0.75rem' }}>Doanh Thu {selectedYear}</span>
                    <h6 className="fw-bold text-primary mt-1 mb-0 fs-6 fs-md-5">{formatMoney(kpi.totalRevenueYear)}</h6>
                  </div>
                  <div className="fs-3 text-primary d-none d-sm-block">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-xl-3">
              <div className="card border-0 shadow-sm border-start border-success border-4 p-2 p-md-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '0.75rem' }}>Phòng Đang Thuê</span>
                    <h6 className="fw-bold text-success mt-1 mb-0 fs-6 fs-md-5">{kpi.occupiedRooms} phòng</h6>
                  </div>
                  <div className="fs-3 text-success d-none d-sm-block">
                    <i className="bi bi-house-check"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-xl-3">
              <div className="card border-0 shadow-sm border-start border-danger border-4 p-2 p-md-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '0.75rem' }}>Hóa Đơn Nợ</span>
                    <h6 className="fw-bold text-danger mt-1 mb-0 fs-6 fs-md-5">{kpi.unpaidCount} HĐ</h6>
                  </div>
                  <div className="fs-3 text-danger d-none d-sm-block">
                    <i className="bi bi-exclamation-circle"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-xl-3">
              <div className="card border-0 shadow-sm border-start border-info border-4 p-2 p-md-3 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ fontSize: '0.75rem' }}>Hóa Đơn Đã Thu</span>
                    <h6 className="fw-bold text-info mt-1 mb-0 fs-6 fs-md-5">{invoiceStatus.paid} HĐ</h6>
                  </div>
                  <div className="fs-3 text-info d-none d-sm-block">
                    <i className="bi bi-check-circle"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biểu Đồ Thống Kê */}
          <div className="row g-3">
            {/* Biểu đồ Doanh Thu 12 Tháng */}
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm p-3 bg-white h-100">
                <h6 className="fw-bold mb-3 text-dark small">📊 Doanh Thu Theo Tháng (Năm {selectedYear})</h6>
                {isLoading ? (
                  <div className="text-center py-5 text-muted small">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Đang tải biểu đồ...
                  </div>
                ) : (
                  <div style={{ minHeight: '260px', height: '300px', position: 'relative', width: '100%' }}>
                    <Bar 
                      data={barChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
                        },
                        scales: {
                          x: { ticks: { font: { size: 10 } } },
                          y: { ticks: { font: { size: 10 } } }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Biểu đồ Trạng Thái Hóa Đơn */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm p-3 bg-white h-100">
                <h6 className="fw-bold mb-3 text-dark small">🍩 Trạng Thái Hóa Đơn</h6>
                {isLoading ? (
                  <div className="text-center py-5 text-muted small">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Đang tải...
                  </div>
                ) : (
                  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '240px', height: '280px', width: '100%' }}>
                    {invoiceStatus.paid === 0 && invoiceStatus.unpaid === 0 ? (
                      <div className="text-muted small">Chưa có dữ liệu hóa đơn cho năm {selectedYear}</div>
                    ) : (
                      <Pie 
                        data={pieChartData} 
                        options={{ 
                          responsive: true, 
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                          }
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
    </div>
  );
}