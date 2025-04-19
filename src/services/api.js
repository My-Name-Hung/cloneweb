// Đảm bảo API_URL chính xác
const API_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

// Hàm helper để thực hiện các API call
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

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

    // Kiểm tra nếu response không ok, throw error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error data:`, errorData);
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

    // Log the original path for debugging
    console.log("Original image path:", path);

    // If it's already a full URL, return it
    if (path.startsWith("http")) {
      console.log("Path is already a full URL, using as is:", path);
      return path;
    }

    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Combine with API URL
    const fullUrl = `${API_URL}${normalizedPath}`;
    console.log("Constructed full image URL:", fullUrl);

    return fullUrl;
  },
};

export default apiCall;
