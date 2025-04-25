import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css";
import { dashboardApi } from "../utils/apiService";
import { formatCurrency } from "../utils/formatters";

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      userCount: 0,
      loanCount: 0,
      loanStats: {
        pending: 0,
        approved: 0,
        rejected: 0,
        disbursed: 0,
        completed: 0,
      },
      totalLoanAmount: 0,
      currentInterestRate: 0.12,
    },
    recentUsers: [],
    recentLoans: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Để trigger refresh khi cần

  // Lấy dữ liệu dashboard từ API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await dashboardApi.getDashboardData();
        if (data.success) {
          console.log("Dashboard data loaded:", data);
          setDashboardData(data);
        } else {
          setError(data.message || "Không thể tải dữ liệu bảng điều khiển");
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setError(
          error.response?.data?.message || "Lỗi khi tải dữ liệu bảng điều khiển"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshKey]); // refreshKey thay đổi sẽ trigger effect này

  // Hàm refresh data
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Dữ liệu cho biểu đồ tròn
  const doughnutData = {
    labels: ["Chờ duyệt", "Đã duyệt", "Từ chối", "Đã giải ngân", "Hoàn thành"],
    datasets: [
      {
        data: [
          dashboardData.stats.loanStats.pending,
          dashboardData.stats.loanStats.approved,
          dashboardData.stats.loanStats.rejected,
          dashboardData.stats.loanStats.disbursed,
          dashboardData.stats.loanStats.completed,
        ],
        backgroundColor: [
          "#FFAB00", // warning - chờ duyệt
          "#0065FF", // primary - đã duyệt
          "#FF5630", // danger - từ chối
          "#00B8D9", // info - đã giải ngân
          "#36B37E", // success - hoàn thành
        ],
        borderWidth: 1,
      },
    ],
  };

  // Tùy chọn cho biểu đồ tròn
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12,
          },
          color: window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "#E1E3E5"
            : "#2D3748",
        },
      },
    },
    cutout: "65%",
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Đang tải dữ liệu bảng điều khiển...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Lỗi</h2>
        <p>{error}</p>
        <button onClick={handleRefresh} className="action-button primary">
          Thử lại
        </button>
      </div>
    );
  }

  const { stats, recentLoans, recentUsers } = dashboardData;

  return (
    <div className="dashboard-container">
      <div className="admin-page-header">
        <h1>Bảng Điều Khiển</h1>
        <div className="header-actions">
          <button className="action-button primary" onClick={handleRefresh}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: "8px" }}
            >
              <path
                d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                fill="currentColor"
              />
            </svg>
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Tổng số hợp đồng vay</h3>
          <p className="stat-value">{stats.loanCount}</p>
          <Link to="/admin/loans" className="stat-link">
            <span>Xem tất cả hợp đồng vay</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"
                fill="currentColor"
              />
            </svg>
          </Link>
        </div>

        <div className="stat-card">
          <h3>Tổng số người dùng</h3>
          <p className="stat-value">{stats.userCount}</p>
          <Link to="/admin/users" className="stat-link">
            <span>Xem tất cả người dùng</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"
                fill="currentColor"
              />
            </svg>
          </Link>
        </div>

        <div className="stat-card">
          <h3>Tổng số tiền cho vay</h3>
          <p className="stat-value">{formatCurrency(stats.totalLoanAmount)}</p>
        </div>

        <div className="stat-card">
          <h3>Lãi suất hiện tại</h3>
          <p className="stat-value">{stats.currentInterestRate.toFixed(2)}%</p>
          <Link to="/admin/settings" className="stat-link">
            <span>Cập nhật lãi suất</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"
                fill="currentColor"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="chart-wrapper">
        <div className="chart-header">
          <h2 className="chart-title">Trạng thái hợp đồng vay</h2>
        </div>
        <div className="chart-content">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      <div className="admin-section">
        <h2 className="section-title">Các hợp đồng vay gần đây</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã hợp đồng</th>
                <th>Người dùng</th>
                <th className="mobile-hidden">Số tiền vay</th>
                <th className="mobile-hidden">Kỳ hạn</th>
                <th className="status-column">Trạng thái</th>
                <th className="actions-column">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {recentLoans && recentLoans.length > 0 ? (
                recentLoans.map((loan) => (
                  <tr key={loan._id}>
                    <td>{loan.contractId}</td>
                    <td>
                      {loan.userId
                        ? loan.userId.fullName || loan.userId.phone
                        : "N/A"}
                    </td>
                    <td className="mobile-hidden">
                      {formatCurrency(loan.loanAmount)}
                    </td>
                    <td className="mobile-hidden">{loan.loanTerm} tháng</td>
                    <td className="status-column">
                      <span className={`status-badge ${loan.status}`}>
                        {loan.status === "pending" && "Chờ duyệt"}
                        {loan.status === "approved" && "Đã duyệt"}
                        {loan.status === "rejected" && "Từ chối"}
                        {loan.status === "disbursed" && "Đã giải ngân"}
                        {loan.status === "completed" && "Hoàn thành"}
                      </span>
                    </td>
                    <td className="actions-column">
                      <Link
                        to={`/admin/loans/${loan._id}`}
                        className="action-button primary"
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    Không có hợp đồng vay nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentLoans && recentLoans.length > 0 && (
          <div className="view-all-link">
            <Link to="/admin/loans" className="action-button secondary">
              Xem tất cả hợp đồng
            </Link>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h2 className="section-title">Người dùng mới</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Số điện thoại</th>
                <th>Họ tên</th>
                <th className="status-column">Trạng thái</th>
                <th className="mobile-hidden">Ngày đăng ký</th>
                <th className="actions-column">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.phone}</td>
                    <td>{user.fullName || "Chưa cập nhật"}</td>
                    <td className="status-column">
                      <span
                        className={`status-badge ${
                          user.hasVerifiedDocuments ? "success" : "warning"
                        }`}
                      >
                        {user.hasVerifiedDocuments
                          ? "Đã xác minh"
                          : "Chưa xác minh"}
                      </span>
                    </td>
                    <td className="mobile-hidden">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="actions-column">
                      <Link
                        to={`/admin/users/${user._id}`}
                        className="action-button primary"
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    Không có người dùng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentUsers && recentUsers.length > 0 && (
          <div className="view-all-link">
            <Link to="/admin/users" className="action-button secondary">
              Xem tất cả người dùng
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
