import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { loansApi } from "../../../admin/utils/apiService";
import { useAdmin } from "../../../context/AdminContext";
import "../../styles/DeleteConfirm.css";
import "../../styles/LoansList.css";

const ITEMS_PER_PAGE = 10;

const LoansList = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    pages: 1,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [cachedData, setCachedData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const { admin, refreshSession } = useAdmin();

  // Memoize the cache key
  const cacheKey = useMemo(() => {
    return `loans_${pagination.page}_${searchQuery}`;
  }, [pagination.page, searchQuery]);

  // Handle authentication errors with debounce
  useEffect(() => {
    let debounceTimer;
    const handleAuthError = (event) => {
      if (event.detail?.url?.includes("/admin/loans")) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (retryCount < 3) {
            setRetryCount((prev) => prev + 1);
          } else {
            setError(
              "Không thể tải danh sách khoản vay. Vui lòng thử lại sau."
            );
            setLoading(false);
          }
        }, 1000);
      }
    };

    window.addEventListener("adminAuthError", handleAuthError);
    return () => {
      window.removeEventListener("adminAuthError", handleAuthError);
      clearTimeout(debounceTimer);
    };
  }, [retryCount]);

  // Function to fetch loans data with caching
  const fetchLoans = useCallback(
    async (page = 1, limit = ITEMS_PER_PAGE, search = "") => {
      if (isFetching) return;

      // Check cache first
      if (cachedData[cacheKey]) {
        setLoans(cachedData[cacheKey].loans);
        setPagination(cachedData[cacheKey].pagination);
        return;
      }

      try {
        setIsFetching(true);
        setLoading(true);
        setError(null);

        // Ensure token is fresh before making the request
        if (admin?.token) {
          await refreshSession();
        }

        const response = await loansApi.getLoans(page, limit, search);

        if (response.success) {
          const newLoans = response.loans || [];
          const newPagination = response.pagination || {
            page,
            limit,
            total: newLoans.length || 0,
            pages: 1,
          };

          // Update cache
          setCachedData((prev) => ({
            ...prev,
            [cacheKey]: {
              loans: newLoans,
              pagination: newPagination,
              timestamp: Date.now(),
            },
          }));

          setLoans(newLoans);
          setPagination(newPagination);
          setIsDataFetched(true);
        } else {
          setError(response.message || "Không thể tải danh sách khoản vay");
          setLoans([]);
        }
      } catch (err) {
        console.error("Error fetching loans:", err);
        setError("Không thể tải danh sách khoản vay. Vui lòng thử lại sau.");
        setLoans([]);

        // Only retry on network errors and if we haven't exceeded max retries
        if (err.message?.includes("Network Error") && retryCount < 3) {
          setRetryCount((prev) => prev + 1);
        }
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [admin?.token, refreshSession, retryCount, isFetching, cacheKey, cachedData]
  );

  // Clear expired cache entries
  useEffect(() => {
    const clearExpiredCache = () => {
      const now = Date.now();
      const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

      setCachedData((prev) => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach((key) => {
          if (now - newCache[key].timestamp > CACHE_EXPIRY) {
            delete newCache[key];
          }
        });
        return newCache;
      });
    };

    const interval = setInterval(clearExpiredCache, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!isDataFetched && !isFetching) {
      fetchLoans(pagination.page, pagination.limit, searchQuery);
    }
  }, [
    retryCount,
    isDataFetched,
    fetchLoans,
    pagination.page,
    pagination.limit,
    isFetching,
    searchQuery,
  ]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages && !loading) {
      setPagination({ ...pagination, page: newPage });
      fetchLoans(newPage, pagination.limit, searchQuery);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!loading) {
      setIsDataFetched(false);
      setPagination({ ...pagination, page: 1 });
      // Clear related cache entries
      setCachedData((prev) => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach((key) => {
          if (key.includes(`loans_`)) {
            delete newCache[key];
          }
        });
        return newCache;
      });
      fetchLoans(1, ITEMS_PER_PAGE, searchQuery);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Memoized status text getter
  const getStatusText = useMemo(
    () => (status) => {
      const statusMap = {
        pending: "Đang chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Từ chối",
        disbursed: "Đã giải ngân",
        completed: "Đã hoàn thành",
        overdue: "Quá hạn",
      };
      return statusMap[status] || status;
    },
    []
  );

  // Add confirmation dialog component
  const DeleteConfirmDialog = ({ onConfirm, onCancel }) => (
    <div className="delete-confirm-overlay">
      <div className="delete-confirm-dialog">
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa khoản vay này không?</p>
        <div className="delete-confirm-actions">
          <button
            className="delete-confirm-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
          <button
            className="delete-cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );

  // Update handleDeleteLoan to use the confirmation dialog
  const handleDeleteClick = (loanId) => {
    setLoanToDelete(loanId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!loanToDelete) return;

    try {
      setLoading(true);
      await refreshSession();

      const response = await loansApi.deleteLoan(loanToDelete);

      if (response.success) {
        // Remove loan from state
        setLoans(loans.filter((loan) => loan._id !== loanToDelete));

        // Update pagination
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));

        // Clear cache to force refresh on next load
        setCachedData((prev) => {
          const newCache = { ...prev };
          Object.keys(newCache).forEach((key) => {
            if (key.includes("loans_")) {
              delete newCache[key];
            }
          });
          return newCache;
        });

        setShowDeleteConfirm(false);
        setLoanToDelete(null);
        setError(null);

        // Show success message
        const successMessage = "Đã xóa khoản vay thành công";
        setError({ type: "success", message: successMessage });
        setTimeout(() => setError(null), 3000);
      } else {
        setError({
          type: "error",
          message: response.message || "Không thể xóa khoản vay",
        });
      }
    } catch (error) {
      console.error("Error deleting loan:", error);
      setError({
        type: "error",
        message: error.response?.data?.message || "Lỗi khi xóa khoản vay",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setLoanToDelete(null);
  };

  // Handle error retry button
  const handleRetry = () => {
    if (!loading) {
      setIsDataFetched(false);
      setRetryCount(0);
      fetchLoans(pagination.page, pagination.limit, searchQuery);
    }
  };

  // Add confirmation dialog for delete all
  const DeleteAllConfirmDialog = ({ onConfirm, onCancel }) => (
    <div className="delete-confirm-overlay">
      <div className="delete-confirm-dialog">
        <h3>Xác nhận xóa tất cả</h3>
        <p>
          Bạn có chắc chắn muốn xóa tất cả hợp đồng vay không? Hành động này
          không thể hoàn tác!
        </p>
        <div className="delete-confirm-actions">
          <button
            className="delete-confirm-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Đang xóa..." : "Xóa tất cả"}
          </button>
          <button
            className="delete-cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );

  // Handle delete all confirmation
  const handleDeleteAllConfirm = async () => {
    try {
      setLoading(true);
      await refreshSession();

      // Get fresh token
      const token = localStorage.getItem("adminToken");

      // Make API call with proper headers
      const response = await api.delete("/api/admin/loans", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        // Clear loans from state
        setLoans([]);

        // Update pagination
        setPagination((prev) => ({
          ...prev,
          total: 0,
          pages: 1,
        }));

        // Clear cache
        setCachedData({});

        setShowDeleteAllConfirm(false);
        setError(null);

        // Show success message
        const successMessage = "Đã xóa tất cả hợp đồng vay thành công";
        setError({ type: "success", message: successMessage });
        setTimeout(() => setError(null), 3000);

        // Refresh the loans list
        fetchLoans(1, pagination.limit, searchQuery);
      } else {
        setError({
          type: "error",
          message: response.data.message || "Không thể xóa hợp đồng vay",
        });
      }
    } catch (error) {
      console.error("Error deleting all loans:", error);
      setError({
        type: "error",
        message: error.response?.data?.message || "Lỗi khi xóa hợp đồng vay",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isDataFetched) {
    return (
      <div className="admin-content-container">
        <div className="admin-content-header">
          <h1>Quản lý khoản vay</h1>
        </div>
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Đang tải danh sách khoản vay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-container">
      <div className="admin-content-header">
        <h1>Quản lý khoản vay</h1>
        <button
          className="admin-button delete-all-button"
          onClick={() => setShowDeleteAllConfirm(true)}
          disabled={loading || loans.length === 0}
        >
          Xóa tất cả
        </button>
      </div>

      <div className="admin-filters">
        <form onSubmit={handleSearch} className="admin-search-form">
          <div className="search-group">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã khoản vay hoặc tên người vay"
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
            <button type="submit" className="admin-button" disabled={loading}>
              {loading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
          {/* <div className="filter-group">
            <select
              value={status}
              onChange={handleStatusChange}
              disabled={loading}
              className="status-filter"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Đang chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="disbursed">Đã giải ngân</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="overdue">Quá hạn</option>
            </select>
          </div> */}
        </form>
      </div>

      {error && (
        <div className="admin-error-message">
          <p>{error.message}</p>
          <button
            className="admin-button"
            onClick={handleRetry}
            disabled={loading}
          >
            {loading ? "Đang tải lại..." : "Thử lại"}
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {showDeleteAllConfirm && (
        <DeleteAllConfirmDialog
          onConfirm={handleDeleteAllConfirm}
          onCancel={() => setShowDeleteAllConfirm(false)}
        />
      )}

      {!loading && !error && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã vay</th>
                <th>Người vay</th>
                <th>Số tiền (VNĐ)</th>
                <th>Kỳ hạn</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loans.length > 0 ? (
                loans.map((loan) => (
                  <tr key={loan._id}>
                    <td>{loan._id.substring(0, 8)}...</td>
                    <td>{loan.userId.fullName}</td>
                    <td>
                      {typeof loan.loanAmount === "string"
                        ? loan.loanAmount
                        : loan.loanAmount?.toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </td>
                    <td>{loan.term} tháng</td>
                    <td>
                      <span
                        className={`status-badge status-${loan.status.toLowerCase()}`}
                      >
                        {getStatusText(loan.status)}
                      </span>
                    </td>
                    <td>
                      {new Date(loan.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/admin/loans/${loan._id}`}
                          className="view-button"
                        >
                          Xem
                        </Link>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteClick(loan._id)}
                          disabled={loan.status === "approved" || loading}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    Không tìm thấy khoản vay nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="pagination-button"
          >
            &laquo; Trang trước
          </button>
          <span className="pagination-info">
            Trang {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages || loading}
            className="pagination-button"
          >
            Trang tiếp &raquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default LoansList;
