// Lấy URL API từ biến môi trường hoặc sử dụng default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Hàm helper để thực hiện các API call
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  try {
    console.log(`Calling API: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      // Bỏ hoặc comment các dòng dưới đây
      // credentials: "include",
      // mode: "cors",
    });

    // Kiểm tra nếu response không ok, throw error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API call failed with status: ${response.status}`
      );
    }

    // Parse response nếu có dữ liệu
    return response.json().catch(() => ({}));
  } catch (error) {
    console.error(`API Error (${url}):`, error);
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

export const uploadImage = async (imageData, userId, type) => {
  try {
    // For base64 images
    if (imageData.startsWith("data:image")) {
      return apiCall("/api/verification/upload/" + type, {
        method: "POST",
        body: JSON.stringify({
          userId,
          imageData,
        }),
      });
    }
    // For file uploads (could be implemented if needed)
    else {
      // Handle file upload
      const formData = new FormData();
      formData.append("image", imageData);
      formData.append("userId", userId);

      return fetch(`${API_URL}/api/verification/upload/${type}`, {
        method: "POST",
        body: formData,
        // No Content-Type header for multipart/form-data
      }).then((response) => {
        if (!response.ok) throw new Error("Upload failed");
        return response.json();
      });
    }
  } catch (error) {
    console.error(`Error uploading ${type} image:`, error);
    throw error;
  }
};

export const imageApi = {
  upload: uploadImage,

  // Get a properly formatted image URL
  getImageUrl: (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
  },
};

export default apiCall;
