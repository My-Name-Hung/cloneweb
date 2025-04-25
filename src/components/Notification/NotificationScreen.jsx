import React, { useEffect, useState } from "react";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import thongbaoImage from "../../assets/Home/thongbao.png"; // Import hình ảnh
import "./NotificationScreen.css";

const NotificationScreen = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        // Sắp xếp thông báo theo thời gian mới nhất
        const sortedNotifications = data.notifications.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Cập nhật thông báo mỗi 5 giây
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    navigate(-1); // Quay lại trang trước đó
  };

  if (loading) {
    return (
      <div className="notification-screen">
        <div className="notification-header">
          <a href="/">
            <button className="back-buttons" onClick={handleBack}>
              <FaLongArrowAltLeft />
            </button>
          </a>
          <h1>Thông báo</h1>
        </div>
        <div className="loading-notifications">
          <div className="loading-spinner"></div>
          <p>Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-screen">
      {/* Header */}
      <div className="notification-header">
        <a href="/">
          <button className="back-buttons" onClick={handleBack}>
            <FaLongArrowAltLeft />
          </button>
        </a>
        <h1 className="notification-title">Thông báo</h1>
        <div className="placeholder"></div>
      </div>

      {/* Notification Content */}
      <div className="notification-content">
        {notifications.length === 0 ? (
          <div className="empty-notification">
            <div className="notification-icon-container">
              {/* Sử dụng hình ảnh thay vì SVG */}
              <img
                src={thongbaoImage}
                alt="Không có thông báo"
                className="notification-image"
              />
            </div>
            <p className="empty-text">Chưa có thông báo nào.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${
                  notification.type === "loan_rejected"
                    ? "rejected"
                    : "approved"
                }`}
              >
                <div className="notification-icon">
                  {notification.type === "loan_rejected" ? (
                    <i className="fas fa-times-circle"></i>
                  ) : (
                    <i className="fas fa-check-circle"></i>
                  )}
                </div>
                <div className="notification-details">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationScreen;
