import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Define API base URL with a fallback for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Thêm kiểm tra xem route hiện tại có yêu cầu xác minh không
const requiresVerification = (pathname) => {
  const verificationRoutes = ["/loan-confirmation", "/my-contract"];
  return verificationRoutes.includes(pathname);
};

const RequireAuth = ({ children }) => {
  const {
    user,
    loading,
    setUser,
    updateBankInfo,
    checkUserVerificationStatus,
  } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndVerification = async () => {
      try {
        // Kiểm tra authentication
        if (!user) {
          const userData = localStorage.getItem("userData");
          if (!userData) {
            setAuthChecked(true);
            return;
          }

          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }

        // Nếu route hiện tại yêu cầu xác minh, kiểm tra trạng thái xác minh
        if (requiresVerification(location.pathname)) {
          const verificationStatus = await checkUserVerificationStatus();

          if (!verificationStatus.verified) {
            // Lưu route hiện tại để redirect sau khi xác minh
            localStorage.setItem(
              "redirectAfterVerification",
              location.pathname
            );

            // Điều hướng đến bước xác minh đầu tiên dựa trên trạng thái
            if (!verificationStatus.hasPersonalInfo) {
              navigate("/verification");
            } else if (!verificationStatus.hasBankInfo) {
              navigate("/bank-info");
            }
          }
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Authentication check error:", error);
        setAuthChecked(true);
      }
    };

    if (!loading) {
      checkAuthAndVerification();
    }
  }, [user, loading, location.pathname]);

  // Nếu đang kiểm tra auth, hiển thị màn hình loading
  if (loading || !authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Sau khi kiểm tra, nếu không có user, chuyển đến trang login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Người dùng đã đăng nhập (có xác minh hoặc chưa) đều được phép truy cập
  return children;
};

export default RequireAuth;
