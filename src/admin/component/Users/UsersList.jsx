import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { usersApi } from "../../../admin/utils/apiService";
import { useAdmin } from "../../../context/AdminContext";
import "../../styles/DeleteConfirm.css";
import "../../styles/UsersList.css";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const { admin, refreshSession } = useAdmin();

  // Add confirmation dialog component
  const DeleteConfirmDialog = ({ onConfirm, onCancel }) => (
    <div className="delete-confirm-overlay">
      <div className="delete-confirm-dialog">
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa người dùng này không?</p>
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

  // Add confirmation dialog for delete all
  const DeleteAllConfirmDialog = ({ onConfirm, onCancel }) => (
    <div className="delete-confirm-overlay">
      <div className="delete-confirm-dialog">
        <h3>Xác nhận xóa tất cả</h3>
        <p>
          Bạn có chắc chắn muốn xóa tất cả người dùng không? Hành động này không
          thể hoàn tác!
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

  // Handle delete click
  const handleDeleteClick = (userId) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      await refreshSession();

      const response = await usersApi.deleteUser(userToDelete);

      if (response.success) {
        // Remove user from state
        setUsers(users.filter((user) => user._id !== userToDelete));

        // Update pagination
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));

        setShowDeleteConfirm(false);
        setUserToDelete(null);
        setError(null);

        // Show success message
        const successMessage = "Đã xóa người dùng thành công";
        setError({ type: "success", message: successMessage });
        setTimeout(() => setError(null), 3000);
      } else {
        setError({
          type: "error",
          message: response.message || "Không thể xóa người dùng",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError({
        type: "error",
        message: error.response?.data?.message || "Lỗi khi xóa người dùng",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  // Handle delete all confirmation
  const handleDeleteAllConfirm = async () => {
    try {
      setLoading(true);
      await refreshSession();

      // Use direct API call instead of usersApi.deleteAllUsers
      const response = await api.delete("/api/admin/users");

      if (response.data.success) {
        // Clear users from state
        setUsers([]);

        // Update pagination
        setPagination((prev) => ({
          ...prev,
          total: 0,
          pages: 1,
        }));

        setShowDeleteAllConfirm(false);
        setError(null);

        // Show success message
        const successMessage = "Đã xóa tất cả người dùng thành công";
        setError({ type: "success", message: successMessage });
        setTimeout(() => setError(null), 3000);
      } else {
        setError({
          type: "error",
          message: response.data.message || "Không thể xóa người dùng",
        });
      }
    } catch (error) {
      console.error("Error deleting all users:", error);
      setError({
        type: "error",
        message: error.response?.data?.message || "Lỗi khi xóa người dùng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle authentication errors with debounce
  useEffect(() => {
    let debounceTimer;
    const handleAuthError = (event) => {
      if (event.detail?.url?.includes("/admin/users")) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (retryCount < 3) {
            setRetryCount((prev) => prev + 1);
          } else {
            setError(
              "Không thể tải danh sách người dùng. Vui lòng thử lại sau."
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

  // Function to fetch users data
  const fetchUsers = useCallback(
    async (page = 1, limit = 10) => {
      if (isFetching) return;

      try {
        setIsFetching(true);
        setLoading(true);
        setError(null);

        // Ensure token is fresh before making the request
        if (admin?.token) {
          await refreshSession();
        }

        const response = await usersApi.getUsers(page, limit, searchQuery);

        if (response.success) {
          setUsers(response.users || []);
          setPagination(
            response.pagination || {
              page,
              limit,
              total: response.users?.length || 0,
              pages: 1,
            }
          );
          setIsDataFetched(true);
        } else {
          setError(response.message || "Không thể tải danh sách người dùng");
          setUsers([]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.");
        setUsers([]);

        // Only retry on network errors and if we haven't exceeded max retries
        if (err.message?.includes("Network Error") && retryCount < 3) {
          setRetryCount((prev) => prev + 1);
        }
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [admin?.token, refreshSession, searchQuery, retryCount, isFetching]
  );

  // Initial data fetch
  useEffect(() => {
    if (!isDataFetched && !isFetching) {
      fetchUsers(pagination.page, pagination.limit);
    }
  }, [
    retryCount,
    isDataFetched,
    fetchUsers,
    pagination.page,
    pagination.limit,
    isFetching,
  ]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages && !loading) {
      setPagination({ ...pagination, page: newPage });
      fetchUsers(newPage, pagination.limit);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!loading) {
      setIsDataFetched(false);
      setPagination({ ...pagination, page: 1 });
      fetchUsers(1, pagination.limit);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  if (loading && !isDataFetched) {
    return (
      <div className="admin-content-container">
        <div className="admin-content-header">
          <h1>Quản lý người dùng</h1>
        </div>
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-container">
      <div className="admin-content-header">
        <h1>Quản lý người dùng</h1>
        <div className="admin-header-buttons">
          <Link to="/admin/users/new" className="admin-button">
            Thêm người dùng mới
          </Link>
          <button
            className="admin-button delete-all-button"
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={loading || users.length === 0}
          >
            Xóa tất cả
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <form onSubmit={handleSearch} className="admin-search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc số điện thoại"
            value={searchQuery}
            onChange={handleSearchInputChange}
          />
          <button type="submit" className="admin-button" disabled={loading}>
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>
      </div>

      {error && (
        <div className={`admin-error-message ${error.type || "error"}`}>
          <p>{error.message}</p>
          <button
            onClick={() => {
              if (!loading) {
                setIsDataFetched(false);
                setRetryCount(0);
                fetchUsers(pagination.page, pagination.limit);
              }
            }}
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
                <th>ID</th>
                <th>Họ và tên</th>
                <th>Số điện thoại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user._id.substring(0, 8)}...</td>
                    <td>{user.fullName}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          user.hasVerifiedDocuments
                            ? "verified-badge"
                            : "unverified-badge"
                        }`}
                      >
                        {user.hasVerifiedDocuments
                          ? "Đã xác thực"
                          : "Chưa xác thực"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="view-button"
                        >
                          Xem
                        </Link>
                        <Link
                          to={`/admin/users/${user._id}/edit`}
                          className="edit-button"
                        >
                          Sửa
                        </Link>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteClick(user._id)}
                          disabled={loading}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    Không tìm thấy người dùng nào
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

export default UsersList;
