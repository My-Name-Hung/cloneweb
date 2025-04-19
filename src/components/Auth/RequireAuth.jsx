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
        // If user already exists in context, we're authenticated
        if (user) {
          console.log("User found in context:", user);

          // Cập nhật thông tin ngân hàng nếu user đã đăng nhập
          if (user.id) {
            console.log(
              "Đang kiểm tra và cập nhật thông tin ngân hàng cho user:",
              user.id
            );
            await updateBankInfo();
          }

          setAuthChecked(true);
          return;
        }

        // If user is not in context, check localStorage
        const userData = localStorage.getItem("userData");

        if (userData) {
          console.log("User found in localStorage, updating context");
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Cập nhật thông tin ngân hàng nếu có thông tin user
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

    // Only run the check when loading is complete
    if (!loading) {
      checkAuthentication();
    }
  }, [user, loading, setUser, updateBankInfo]);

  // If still checking authentication, show nothing (or a loader)
  if (loading || !authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // After checking, if no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated
  return children;
};

export default RequireAuth;
