// Đảm bảo API_URL chính xác
const API_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

// Tracking for recurring API calls to prevent loops
const pendingRequests = new Map();
const MAX_CONSECUTIVE_FAILURES = 2;

// Hàm helper để thực hiện các API call
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const requestKey = `${options.method || "GET"}-${url}`;

  // Check if this is a repeated failing request
  if (pendingRequests.has(requestKey)) {
    const failureCount = pendingRequests.get(requestKey);
    if (failureCount >= MAX_CONSECUTIVE_FAILURES) {
      console.warn(`Preventing repeated failing request to: ${url}`);
      pendingRequests.delete(requestKey); // Reset after preventing
      return Promise.reject(
        new Error("Request prevented due to repeated failures")
      );
    }
  }

  try {
    console.log(`Calling API: ${url} with method: ${options.method || "GET"}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Log response status
    console.log(`API response status: ${response.status} for ${url}`);

    // Reset pending request tracking on success
    pendingRequests.delete(requestKey);

    // Kiểm tra nếu response không ok, throw error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error data:`, errorData);

      // Track failures
      const currentFailures = pendingRequests.get(requestKey) || 0;
      pendingRequests.set(requestKey, currentFailures + 1);

      throw new Error(
        errorData.message || `API call failed with status: ${response.status}`
      );
    }

    // Parse response nếu có dữ liệu
    return response.json().catch(() => ({}));
  } catch (error) {
    console.error(`API Error (${url}):`, error);

    // Track failures for this endpoint
    const currentFailures = pendingRequests.get(requestKey) || 0;
    pendingRequests.set(requestKey, currentFailures + 1);

    throw error;
  }
}

// Các API endpoints
export const authApi = {
  // Đăng nhập
  login: (credentials) => {
    return apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Đăng ký
  signup: (userData) => {
    return apiCall("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Kiểm tra trạng thái đăng nhập
  checkAuth: () => {
    return apiCall("/api/auth/check", {
      method: "GET",
    }).catch((err) => {
      console.log("Auth check failed:", err);
      return { authenticated: false };
    });
  },
};

export const contractApi = {
  // Tạo mã hợp đồng ngẫu nhiên
  generateContractId: () => {
    return apiCall("/api/contracts/generate-id", {
      method: "GET",
    });
  },

  // Lưu hợp đồng
  saveContract: (contractData) => {
    return apiCall("/api/contracts", {
      method: "POST",
      body: JSON.stringify(contractData),
    });
  },

  // Lấy danh sách hợp đồng của user
  getUserContracts: (userId) => {
    if (!userId) {
      return Promise.reject(new Error("User ID is required"));
    }
    return apiCall(`/api/users/${userId}/contracts`, {
      method: "GET",
    });
  },
};

// Upload ảnh (bao gồm CMND/CCCD)
export const uploadImage = async (imageData, userId, type) => {
  // Prevent duplicate upload attempts
  const uploadKey = `upload-${userId}-${type}`;
  if (pendingRequests.has(uploadKey)) {
    const failureCount = pendingRequests.get(uploadKey);
    if (failureCount >= MAX_CONSECUTIVE_FAILURES) {
      console.warn(`Preventing repeated failing upload for user ${userId}`);
      pendingRequests.delete(uploadKey); // Reset after preventing
      return Promise.reject(
        new Error("Upload prevented due to repeated failures")
      );
    }
  }

  try {
    console.log(`Uploading image of type ${type} for user ${userId}`);

    // For base64 images
    if (typeof imageData === "string" && imageData.startsWith("data:image")) {
      console.log("Uploading base64 image data");

      // Xác định endpoint dựa vào loại ảnh
      let endpoint = `/api/verification/upload/${type}`;
      if (type === "idCardFront") {
        endpoint = `/api/verification/id-card/front`;
      } else if (type === "idCardBack") {
        endpoint = `/api/verification/id-card/back`;
      }

      const response = await fetch(`${API_URL}${endpoint}?userId=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          imageData,
        }),
      });

      // Reset on success
      pendingRequests.delete(uploadKey);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Upload failed: ${errorData.message || response.statusText}`
        );

        // Track failures
        const currentFailures = pendingRequests.get(uploadKey) || 0;
        pendingRequests.set(uploadKey, currentFailures + 1);

        throw new Error(
          `Upload failed: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      return result;
    }
    // For file uploads (Blob or File objects)
    else if (imageData instanceof Blob || imageData instanceof File) {
      console.log("Uploading file object");
      const formData = new FormData();
      formData.append("image", imageData);

      // Xác định endpoint dựa vào loại ảnh
      let endpoint = `/api/verification/upload/${type}`;
      if (type === "idCardFront") {
        endpoint = `/api/verification/id-card/front`;
      } else if (type === "idCardBack") {
        endpoint = `/api/verification/id-card/back`;
      }

      const response = await fetch(`${API_URL}${endpoint}?userId=${userId}`, {
        method: "POST",
        body: formData,
        // No Content-Type header for multipart/form-data
      });

      // Reset on success
      pendingRequests.delete(uploadKey);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Upload failed: ${errorData.message || response.statusText}`
        );

        // Track failures
        const currentFailures = pendingRequests.get(uploadKey) || 0;
        pendingRequests.set(uploadKey, currentFailures + 1);

        throw new Error(
          `Upload failed: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      return result;
    } else {
      console.error("Unsupported image data format:", typeof imageData);
      throw new Error("Unsupported image data format");
    }
  } catch (error) {
    console.error(`Error uploading ${type} image:`, error);

    // Track failures
    const currentFailures = pendingRequests.get(uploadKey) || 0;
    pendingRequests.set(uploadKey, currentFailures + 1);

    throw error;
  }
};

export const imageApi = {
  upload: uploadImage,

  // Get a properly formatted image URL
  getImageUrl: (path) => {
    if (!path) return null;

    // Log the original path for debugging
    console.log("Original image path:", path);

    // If it's already a full URL, return it
    if (path.startsWith("http")) {
      console.log("Path is already a full URL, using as is:", path);
      return path;
    }

    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    console.log("Formatted image URL:", `${API_URL}${normalizedPath}`);
    return `${API_URL}${normalizedPath}`;
  },

  // Get user avatar
  getUserAvatar: async (userId) => {
    if (!userId) {
      console.error("getUserAvatar: No user ID provided");
      return null;
    }

    try {
      const response = await apiCall(`/api/users/${userId}/avatar`, {
        method: "GET",
      });

      if (response && response.success && response.avatarUrl) {
        // Ensure we return a full URL
        return (
          response.fullAvatarUrl || imageApi.getImageUrl(response.avatarUrl)
        );
      }
      return null;
    } catch (error) {
      console.error("Error fetching user avatar:", error);
      return null;
    }
  },

  // Lấy thông tin CMND/CCCD
  getIdCardInfo: async (userId) => {
    if (!userId) {
      console.error("getIdCardInfo: No user ID provided");
      return null;
    }

    try {
      const response = await apiCall(`/api/users/${userId}/id-card`, {
        method: "GET",
      });

      if (response && response.success && response.idCardInfo) {
        // Đảm bảo trả về URL đầy đủ cho ảnh
        const idCardInfo = response.idCardInfo;
        if (idCardInfo.frontImage) {
          idCardInfo.frontImageUrl = imageApi.getImageUrl(
            idCardInfo.frontImage
          );
        }
        if (idCardInfo.backImage) {
          idCardInfo.backImageUrl = imageApi.getImageUrl(idCardInfo.backImage);
        }
        return idCardInfo;
      }
      return null;
    } catch (error) {
      console.error("Error fetching ID card info:", error);
      return null;
    }
  },
};

// User profile API
export const userApi = {
  // Get user profile
  getProfile: (userId) => {
    if (!userId) {
      return Promise.reject(new Error("User ID is required"));
    }
    return apiCall(`/api/users/${userId}/profile`, {
      method: "GET",
    });
  },

  // Update user profile
  updateProfile: (userId, profileData) => {
    if (!userId) {
      return Promise.reject(new Error("User ID is required"));
    }
    return apiCall(`/api/users/${userId}/profile`, {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },

  // Get user bank information
  getBankInfo: (userId) => {
    if (!userId) {
      return Promise.reject(new Error("User ID is required"));
    }
    return apiCall(`/api/users/${userId}/bank-info`, {
      method: "GET",
    });
  },

  // Update user bank information
  updateBankInfo: (userId, bankData) => {
    if (!userId) {
      return Promise.reject(new Error("User ID is required"));
    }
    return apiCall(`/api/users/${userId}/bank-info`, {
      method: "POST",
      body: JSON.stringify(bankData),
    });
  },
};

// Verification API
export const verificationApi = {
  // Get verification status
  getStatus: (userId) => {
    if (!userId) {
      return Promise.reject(new Error("User ID is required"));
    }
    return apiCall(`/api/verification/status/${userId}`, {
      method: "GET",
    });
  },
};

// Settings API (lãi suất và các cài đặt khác)
export const settingsApi = {
  // Lấy tất cả cài đặt
  getSettings: () => {
    return apiCall(`/api/settings`, {
      method: "GET",
    });
  },

  // Cập nhật lãi suất (Admin only)
  updateInterestRate: (rate, token) => {
    return apiCall(`/api/admin/settings/interest-rate`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rate }),
    });
  },

  // Cập nhật tất cả cài đặt (Admin only)
  updateSettings: (settingsData, token) => {
    return apiCall(`/api/admin/settings`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settingsData),
    });
  },
};

// Thêm API cho thông báo
export const notificationApi = {
  // Lấy danh sách thông báo
  getNotifications: async (userId) => {
    try {
      const response = await apiCall(`/api/notifications?userId=${userId}`);
      return response;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: async (notificationId) => {
    try {
      const response = await apiCall(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
        }
      );
      return response;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },
};

// Thêm API cho ví tiền
export const walletApi = {
  // Lấy số dư
  getBalance: async (userId) => {
    try {
      const response = await apiCall(`/api/wallet/balance?userId=${userId}`);
      return response;
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw error;
    }
  },

  // Lấy lịch sử giao dịch
  getTransactions: async (userId) => {
    try {
      const response = await apiCall(
        `/api/wallet/transactions?userId=${userId}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  },
};

export default apiCall;
