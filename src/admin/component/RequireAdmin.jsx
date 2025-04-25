import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { notificationApi } from "../../services/api";

const RequireAdmin = ({ children }) => {
  const { isAuthenticated, loading, admin, refreshSession } = useAdmin();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  // Debug log to track authentication process
  useEffect(() => {
    console.log("RequireAdmin - Authentication state:", {
      isAuthenticated,
      loading,
      path: location.pathname,
      adminExists: !!admin,
    });
  }, [isAuthenticated, loading, location, admin]);

  // Check authentication if there's a token but not authenticated
  useEffect(() => {
    // Prevent excessive refresh attempts
    if (refreshAttempts >= 2) {
      console.log("RequireAdmin - Maximum refresh attempts reached");
      setAuthFailed(true);
      return;
    }

    const checkAuth = async () => {
      // Only attempt refresh if not loading, not authenticated, not currently checking, and no auth failure
      if (!loading && !isAuthenticated && !isChecking && !authFailed) {
        setIsChecking(true);
        console.log("RequireAdmin - Attempting to refresh session");

        try {
          const adminData = localStorage.getItem("admin");

          if (adminData) {
            console.log(
              "RequireAdmin - Found admin data in localStorage, refreshing"
            );
            const refreshResult = await refreshSession();

            if (!refreshResult) {
              console.log("RequireAdmin - Session refresh failed");
              setAuthFailed(true);
            } else {
              console.log("RequireAdmin - Session refresh successful");
            }
          } else {
            console.log("RequireAdmin - No admin data in localStorage");
            setAuthFailed(true);
          }
        } catch (error) {
          console.error("RequireAdmin - Error refreshing session:", error);
          setAuthFailed(true);
        } finally {
          setIsChecking(false);
          setRefreshAttempts((prev) => prev + 1);
        }
      }
    };

    // Add a small delay before checking auth to prevent rapid cycles
    const timeoutId = setTimeout(checkAuth, 300);
    return () => clearTimeout(timeoutId);
  }, [
    isAuthenticated,
    loading,
    refreshSession,
    isChecking,
    authFailed,
    refreshAttempts,
  ]);

  // Hàm gửi thông báo khi phê duyệt/từ chối khoản vay
  const sendLoanNotification = async (userId, type, loanId, amount) => {
    try {
      const title =
        type === "approved"
          ? "Khoản vay được phê duyệt"
          : "Khoản vay bị từ chối";

      const message =
        type === "approved"
          ? `Khoản vay của bạn đã được phê duyệt với số tiền ${amount.toLocaleString(
              "vi-VN"
            )} VNĐ`
          : "Khoản vay của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.";

      await notificationApi.createNotification({
        userId,
        title,
        message,
        type: type === "approved" ? "loan_approved" : "loan_rejected",
        loanId,
      });
    } catch (error) {
      console.error("Error sending loan notification:", error);
    }
  };

  // Thêm hàm vào context
  const contextValue = {
    ...admin,
    sendLoanNotification,
  };

  if (loading || isChecking) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Đang kiểm tra xác thực...</p>
      </div>
    );
  }

  if (!isAuthenticated || authFailed) {
    console.log("RequireAdmin - Not authenticated, redirecting to login");
    // Redirect to login page with the current location for redirection after login
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  console.log("RequireAdmin - Authentication successful, rendering children");
  return React.cloneElement(children, { admin: contextValue });
};

export default RequireAdmin;
