import axios from "axios";
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Define API base URL with a fallback for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RequireAuth = ({ children }) => {
  const { user, loading, setUser, updateBankInfo } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Nếu đã có user trong context, đã đăng nhập
        if (user) {
          console.log("User found in context:", user);

          // Không thực hiện API call trong môi trường development
          // Chỉ cập nhật thông tin ngân hàng khi ở production hoặc đã deploy
          if (window.location.hostname !== "localhost") {
            if (user.id) {
              console.log(
                "Đang kiểm tra và cập nhật thông tin ngân hàng cho user:",
                user.id
              );
              await updateBankInfo();
            }
          }

          setAuthChecked(true);
          return;
        }

        // Kiểm tra localStorage nếu chưa có user trong context
        const userData = localStorage.getItem("userData");

        if (userData) {
          console.log("User found in localStorage, updating context");
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Không thực hiện API call trong môi trường development
          if (window.location.hostname !== "localhost") {
            if (parsedUser && parsedUser.id) {
              try {
                const bankInfoRes = await axios.get(
                  `${API_BASE_URL}/api/users/${parsedUser.id}/bank-info`
                );

                if (bankInfoRes.data.success && bankInfoRes.data.bankInfo) {
                  console.log(
                    "Lấy thông tin ngân hàng thành công:",
                    bankInfoRes.data.bankInfo
                  );

                  // Cập nhật user với thông tin ngân hàng mới nhất
                  const updatedUser = {
                    ...parsedUser,
                    bankInfo: bankInfoRes.data.bankInfo,
                  };

                  setUser(updatedUser);
                  localStorage.setItem("userData", JSON.stringify(updatedUser));
                }
              } catch (bankInfoError) {
                console.error(
                  "Không thể lấy thông tin ngân hàng:",
                  bankInfoError
                );
              }
            }
          }

          setAuthChecked(true);
        } else {
          console.log("No user session found, redirecting to login");
          setAuthChecked(true);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setAuthChecked(true);
      }
    };

    // Chỉ chạy khi loading hoàn tất
    if (!loading) {
      checkAuthentication();
    }
  }, [user, loading, setUser, updateBankInfo]);

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
