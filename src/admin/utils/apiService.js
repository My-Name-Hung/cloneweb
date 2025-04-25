import axios from "axios";
import { getCachedData, setCachedData } from "./cacheService";

// Lấy URL từ biến môi trường hoặc sử dụng giá trị mặc định
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log("API service initialized with base URL:", API_URL);

// Thiết lập axios instance với cấu hình chung
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Luôn gửi credentials (cookies)
  timeout: 30000, // Timeout sau 30 giây
});

// Lưu token hiện tại để sử dụng trong trường hợp khẩn cấp
let currentAuthToken = null;

// Hàm để lấy token từ localStorage
const getAdminToken = () => {
  try {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      const parsed = JSON.parse(adminData);
      if (parsed && parsed.token) {
        // Lưu token vào biến global
        currentAuthToken = parsed.token;
        return parsed.token;
      }
    }
    return currentAuthToken; // Fallback to cached token if localStorage is empty
  } catch (error) {
    console.error("Error getting admin token:", error);
    return currentAuthToken; // Fallback to cached token if parsing fails
  }
};

// Interceptor cho request
api.interceptors.request.use(
  (config) => {
    // Force refresh token from localStorage on every request
    const token = getAdminToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // Special handling for admin endpoints
      if (
        config.url.includes("/admin/loans") ||
        config.url.includes("/admin/users")
      ) {
        console.log(`Enhanced security for admin endpoint: ${config.url}`);
        // Double check that token is set for these critical endpoints
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      console.log(
        `Request to ${config.url}: Token added to Authorization header`
      );
    } else {
      console.warn(`Request to ${config.url}: No admin token available`);

      // Emergency fallback for admin routes - try to find token in existing headers
      if (config.url.includes("/admin/") && config.headers.Authorization) {
        console.log(`Using existing Authorization header for ${config.url}`);
      }
    }

    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Interceptor cho response
api.interceptors.response.use(
  (response) => {
    // Debug log cho response thành công
    console.log(
      `API Response: ${response.config.url} - Status: ${response.status}`
    );
    return response;
  },
  (error) => {
    // Chi tiết lỗi
    const errorResponse = error.response || {};
    const status = errorResponse.status;
    const data = errorResponse.data || {};
    const url = error.config?.url || "Unknown URL";

    // Log cụ thể hơn về lỗi
    console.error(`API Error: ${url} - Status: ${status || "Network Error"}`, {
      message: data.message || error.message,
      details: data,
    });

    // Xử lý lỗi 401 Unauthorized (token hết hạn)
    if (status === 401) {
      console.error("401 Unauthorized - Authentication failed", {
        url: url,
        response: data,
      });

      // Tạo event để thông báo lỗi auth
      const authErrorEvent = new CustomEvent("adminAuthError", {
        detail: { url, message: data.message || "Authentication failed" },
      });
      window.dispatchEvent(authErrorEvent);

      // Kiểm tra nếu đang ở trang admin loans hoặc users
      if (url.includes("/admin/loans") || url.includes("/admin/users")) {
        console.log(
          "Authentication failed on protected admin route. Attempting refresh..."
        );

        // Thử refresh lại token trước khi redirect
        const adminData = localStorage.getItem("admin");
        if (adminData) {
          try {
            const { token } = JSON.parse(adminData);
            if (token) {
              console.log("Retrying with existing token...");
              // Thử lại request với token hiện tại (nếu còn request retry)
              if (error.config && !error.config.__isRetryRequest) {
                error.config.__isRetryRequest = true;
                error.config.headers.Authorization = `Bearer ${token}`;
                return axios(error.config);
              }
            }
          } catch (e) {
            console.error("Error parsing admin data during retry:", e);
          }
        }
      }

      // Xóa thông tin admin
      localStorage.removeItem("admin");
      currentAuthToken = null;

      // Chuyển hướng về trang login (nếu đang trong trang admin)
      if (window.location.pathname.startsWith("/admin")) {
        console.log(
          "Redirecting to admin login page due to authentication error"
        );
        // Delay redirect to allow for potential retry
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 300);
      }
    }

    return Promise.reject(error);
  }
);

// Lắng nghe sự kiện đăng nhập để cập nhật token
window.addEventListener("adminLoggedIn", (event) => {
  if (event.detail && event.detail.token) {
    currentAuthToken = event.detail.token;
    console.log("Admin token updated from login event");
  }
});

/**
 * Dashboard API service
 */
export const dashboardApi = {
  // Lấy dữ liệu dashboard
  getDashboardData: async () => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get("/api/admin/dashboard");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu dashboard:", error);
      throw error;
    }
  },
};

/**
 * Users API service
 */
export const usersApi = {
  // Lấy danh sách người dùng với phân trang và tìm kiếm
  getUsers: async (page = 1, limit = 10, search = "") => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get("/api/admin/users", {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      throw error;
    }
  },

  // Get user details
  getUserDetails: async (userId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  },

  // Get user ID card info
  getUserIdCard: async (userId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(`/api/users/${userId}/id-card`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user ID card:", error);
      throw error;
    }
  },

  // Get user contracts/loans
  getUserContracts: async (userId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(`/api/users/${userId}/contracts`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user contracts:", error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.delete(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Delete all users
  deleteAllUsers: async () => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.delete("/api/admin/users");
      return response.data;
    } catch (error) {
      console.error("Error deleting all users:", error);
      throw error;
    }
  },

  // Lấy chi tiết người dùng
  getUserById: async (userId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin người dùng ${userId}:`, error);
      throw error;
    }
  },

  // Cập nhật thông tin người dùng
  updateUser: async (userId, userData) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.put(`/api/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật người dùng ${userId}:`, error);
      throw error;
    }
  },

  // Get user verification documents
  getUserVerificationDocuments: async (userId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(
        `/api/admin/users/${userId}/verification-documents`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user verification documents:", error);
      throw error;
    }
  },
};

/**
 * Loans API service
 */
export const loansApi = {
  // Lấy danh sách khoản vay với phân trang, tìm kiếm và lọc theo trạng thái
  getLoans: async (page = 1, limit = 10, status = "", search = "") => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get("/api/admin/loans", {
        params: { page, limit, status, search },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khoản vay:", error);
      throw error;
    }
  },

  // Lấy chi tiết khoản vay
  getLoanById: async (loanId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(`/api/admin/loans/${loanId}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin khoản vay ${loanId}:`, error);
      throw error;
    }
  },

  // Cập nhật trạng thái khoản vay
  updateLoanStatus: async (loanId, status, notes = "") => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.put(`/api/admin/loans/${loanId}`, {
        status,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái khoản vay ${loanId}:`, error);
      throw error;
    }
  },

  // Phê duyệt khoản vay
  approveLoan: async (loanId) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.put(`/api/admin/loans/${loanId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi phê duyệt khoản vay ${loanId}:`, error);
      throw error;
    }
  },

  // Từ chối khoản vay
  rejectLoan: async (loanId, reason) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.put(`/api/admin/loans/${loanId}/reject`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi từ chối khoản vay ${loanId}:`, error);
      throw error;
    }
  },

  // Cập nhật chữ ký
  updateSignature: async (loanId, signatureImage) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.put(`/api/admin/loans/${loanId}/signature`, {
        signatureImage,
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật chữ ký khoản vay ${loanId}:`, error);
      throw error;
    }
  },

  // Delete loan
  deleteLoan: async (loanId) => {
    try {
      const response = await api.delete(`/api/admin/loans/${loanId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting loan:", error);
      throw error;
    }
  },

  // Delete all loans
  deleteAllLoans: async () => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.delete("/api/admin/loans");
      return response.data;
    } catch (error) {
      console.error("Error deleting all loans:", error);
      throw error;
    }
  },
};

/**
 * Settings API service
 */
export const settingsApi = {
  // Lấy cài đặt hệ thống
  getSettings: async () => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get("/api/admin/settings");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt hệ thống:", error);
      throw error;
    }
  },

  // Cập nhật cài đặt hệ thống
  updateSettings: async (settings) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.put("/api/admin/settings", settings);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật cài đặt hệ thống:", error);
      throw error;
    }
  },

  // Cập nhật lãi suất
  updateInterestRate: async (rate) => {
    try {
      // Ensure token is fresh before critical requests
      const token = getAdminToken();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.put("/api/admin/settings/interest-rate", {
        rate,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật lãi suất:", error);
      throw error;
    }
  },
};

export const fetchData = async (endpoint, options = {}) => {
  const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < cachedData.ttl) {
    return cachedData.data;
  }

  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default api;
