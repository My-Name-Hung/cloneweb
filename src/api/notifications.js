import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Lấy danh sách thông báo
export const getNotifications = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/notifications`);
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Tạo thông báo mới
export const createNotification = async (notificationData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/notifications`,
      notificationData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/notifications/${notificationId}/read`
    );
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};
