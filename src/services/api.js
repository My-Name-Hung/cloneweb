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
      const response = await fetch(
        `${API_URL}/api/verification/upload/${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            imageData,
          }),
        }
      );

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
      formData.append("userId", userId);

      const response = await fetch(
        `${API_URL}/api/verification/upload/${type}`,
        {
          method: "POST",
          body: formData,
          // No Content-Type header for multipart/form-data
        }
      );

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

    // Combine with API URL
    const fullUrl = `${API_URL}${normalizedPath}`;
    console.log("Constructed full image URL:", fullUrl);

    return fullUrl;
  },

  // Get user avatar with full URL
  getUserAvatar: async (userId) => {
    if (!userId) {
      console.error("Missing userId for getUserAvatar");
      return null;
    }

    const avatarKey = `avatar-${userId}`;
    if (pendingRequests.has(avatarKey)) {
      const failureCount = pendingRequests.get(avatarKey);
      if (failureCount >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(
          `Preventing repeated failing avatar fetch for user ${userId}`
        );
        pendingRequests.delete(avatarKey); // Reset after preventing
        return null;
      }
    }

    // Check if we have a recently cached avatar result
    const cachedAvatarTime = localStorage.getItem(
      `avatar_fetch_time_${userId}`
    );
    const currentTime = new Date().getTime();

    // Only try to fetch once every 5 minutes (300000 ms)
    if (cachedAvatarTime && currentTime - parseInt(cachedAvatarTime) < 300000) {
      console.log("Using cached avatar result to prevent API spam");
      const cachedAvatarUrl = localStorage.getItem(`avatar_url_${userId}`);
      return cachedAvatarUrl === "null" ? null : cachedAvatarUrl;
    }

    try {
      console.log(`Fetching avatar for user ${userId}`);

      // Create a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Avatar fetch timed out")), 3000);
      });

      const response = await Promise.race([
        fetch(`${API_URL}/api/users/${userId}/avatar`),
        timeoutPromise,
      ]);

      // Reset on success
      pendingRequests.delete(avatarKey);

      // Cache the fetch time regardless of outcome
      localStorage.setItem(
        `avatar_fetch_time_${userId}`,
        currentTime.toString()
      );

      // Handle 404 specifically - it's an expected response if no avatar exists
      if (response.status === 404) {
        console.log("No avatar found (404 response)");
        localStorage.setItem(`avatar_url_${userId}`, "null");
        return null;
      }

      if (!response.ok) {
        console.error(`Failed to get avatar: ${response.statusText}`);

        // Track failures
        const currentFailures = pendingRequests.get(avatarKey) || 0;
        pendingRequests.set(avatarKey, currentFailures + 1);

        localStorage.setItem(`avatar_url_${userId}`, "null");
        return null;
      }

      const data = await response.json();

      if (data.success && data.fullAvatarUrl) {
        console.log("Avatar found:", data.fullAvatarUrl);
        localStorage.setItem(`avatar_url_${userId}`, data.fullAvatarUrl);
        return data.fullAvatarUrl;
      }

      console.log("No avatar found for user");
      localStorage.setItem(`avatar_url_${userId}`, "null");
      return null;
    } catch (error) {
      console.error("Error getting user avatar:", error);

      // Track failures
      const currentFailures = pendingRequests.get(avatarKey) || 0;
      pendingRequests.set(avatarKey, currentFailures + 1);

      // Cache the negative result to avoid repeated requests
      localStorage.setItem(`avatar_url_${userId}`, "null");
      return null;
    }
  },
};

export default apiCall;
