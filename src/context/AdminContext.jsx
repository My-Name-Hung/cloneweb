import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../admin/utils/apiService";

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Listen for authentication errors from API service
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log(
        "AdminContext - Authentication error event received:",
        event.detail
      );
      if (
        event.detail?.url?.includes("/admin/loans") ||
        event.detail?.url?.includes("/admin/users")
      ) {
        console.log(
          "AdminContext - Attempting automatic token refresh for critical route"
        );
        refreshSession();
      }
    };

    window.addEventListener("adminAuthError", handleAuthError);
    return () => window.removeEventListener("adminAuthError", handleAuthError);
  }, []);

  useEffect(() => {
    // Kiểm tra nếu admin đã đăng nhập
    const checkAdminAuth = async () => {
      setLoading(true);
      try {
        // Lấy dữ liệu admin từ localStorage
        const storedAdmin = localStorage.getItem("admin");
        if (!storedAdmin) {
          setAdmin(null);
          setLoading(false);
          return;
        }

        // Parse dữ liệu admin
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdmin(parsedAdmin);

        // Kiểm tra token có hợp lệ không bằng cách gọi API dashboard
        try {
          // Set token header trước khi gọi API
          if (parsedAdmin && parsedAdmin.token) {
            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${parsedAdmin.token}`;
          }

          // Thử lấy dữ liệu dashboard để kiểm tra token
          const response = await api.get("/api/admin/dashboard");

          // Kiểm tra xem response có thành công không
          if (response && response.data && response.data.success) {
            // Nếu thành công, token vẫn hợp lệ
            console.log(
              "Admin session still valid, dashboard data received:",
              response.data
            );
            setLastRefreshTime(new Date());
          } else {
            // Nếu server trả về success: false
            console.log(
              "Admin session check failed: Server returned unsuccessful response"
            );
            logout();
          }
        } catch (apiError) {
          // Nếu lỗi 401, token không hợp lệ
          if (apiError.response && apiError.response.status === 401) {
            console.log("Admin session expired or invalid token, logging out");
            console.error("API Error details:", apiError.response.data);
            logout();
          } else {
            // Nếu lỗi khác (ví dụ: mạng), in ra nhưng vẫn giữ admin đăng nhập
            console.error("Error validating admin session:", apiError);
            console.log("Network or other error, keeping admin logged in");
          }
        }
      } catch (error) {
        console.error("Error checking admin auth:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();

    // Thiết lập cơ chế kiểm tra token tự động sau mỗi 30 phút
    const autoRefreshInterval = setInterval(() => {
      if (admin) {
        checkAdminAuth();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(autoRefreshInterval);
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      // Clear any existing tokens first
      delete api.defaults.headers.common["Authorization"];

      // Tạo base64 token từ username/password
      const token = btoa(`${username}:${password}`);

      // Thiết lập token tạm thời để kiểm tra
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("Attempting login with credentials:", {
        username,
        tokenSet: !!token,
      });

      // Gọi API đăng nhập
      const response = await api.post("/api/admin/login", {
        username,
        password,
      });

      if (response.data && response.data.success) {
        console.log("Login successful, creating admin session");

        // Tạo đối tượng admin
        const adminData = {
          ...response.data.admin,
          username,
          token,
        };

        // Lưu vào localStorage
        localStorage.setItem("admin", JSON.stringify(adminData));

        // Lưu vào state
        setAdmin(adminData);
        setLastRefreshTime(new Date());

        // Broadcast a login event for other parts of the application
        const loginEvent = new CustomEvent("adminLoggedIn", {
          detail: { token, username },
        });
        window.dispatchEvent(loginEvent);

        return { success: true };
      } else {
        console.log("Login failed:", response.data);
        setError(response.data?.message || "Đăng nhập thất bại");
        // Xóa token tạm thời nếu đăng nhập thất bại
        delete api.defaults.headers.common["Authorization"];
        return { success: false, message: response.data?.message };
      }
    } catch (error) {
      console.error("Admin login error:", error);
      const message = error.response?.data?.message || "Đăng nhập thất bại";
      setError(message);

      // Xóa token tạm thời nếu đăng nhập thất bại
      delete api.defaults.headers.common["Authorization"];

      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Xóa admin từ localStorage
    localStorage.removeItem("admin");

    // Xóa admin từ state
    setAdmin(null);
    setLastRefreshTime(null);

    // Xóa token authorization
    delete api.defaults.headers.common["Authorization"];

    // Broadcast logout event
    const logoutEvent = new CustomEvent("adminLoggedOut");
    window.dispatchEvent(logoutEvent);
  };

  // Hàm kiểm tra và làm mới session
  const refreshSession = async () => {
    if (!admin) return false;

    try {
      // Đảm bảo token được thiết lập
      if (admin.token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${admin.token}`;
      }

      // Thử lấy dữ liệu dashboard để kiểm tra token
      const response = await api.get("/api/admin/dashboard");

      if (response && response.data && response.data.success) {
        // Cập nhật thời gian làm mới cuối cùng
        setLastRefreshTime(new Date());

        // Re-broadcast the login event to refresh token in other components
        const refreshEvent = new CustomEvent("adminTokenRefreshed", {
          detail: { token: admin.token, timestamp: new Date() },
        });
        window.dispatchEvent(refreshEvent);

        return true;
      } else {
        console.log("Session refresh failed: Unsuccessful response");
        return false;
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      if (error.response && error.response.status === 401) {
        logout();
      }
      return false;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!admin,
        lastRefreshTime,
        refreshSession,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
