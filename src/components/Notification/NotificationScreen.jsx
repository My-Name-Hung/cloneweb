import React from "react";
import { useNavigate } from "react-router-dom";
import thongbaoImage from "../../assets/Home/thongbao.png"; // Import hình ảnh
import "./NotificationScreen.css";

const NotificationScreen = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Quay lại trang trước đó
  };

  return (
    <div className="notification-screen">
      {/* Header */}
      <div className="notification-header">
        <button className="back-button" onClick={handleBack}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19L8 12L15 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="notification-title">Thông báo</h1>
        <div className="placeholder"></div>
      </div>

      {/* Notification Content */}
      <div className="notification-content">
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
      </div>
    </div>
  );
};

export default NotificationScreen;
