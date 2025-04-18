import React from "react";
import { useNavigate } from "react-router-dom";
import bankImage from "../../assets/Home/home.png";
import MBLogo from "../../assets/logo/mblogo.png";
import { FaBell, FaWallet, FaHome, FaUser } from "react-icons/fa";
import "./HomeScreen.css";

const HomeScreen = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xóa session storage
    sessionStorage.removeItem("user");
    // Chuyển hướng về trang login
    navigate("/login");
  };

  return (
    <div className="home-container">
      {/* Header */}
      <div className="header">
        <div className="greeting">
          <p>Xin chào,</p>
          <p className="phone-number">{user?.phone || "0705007516"}</p>
        </div>
        <div className="notification-icon">
          <FaBell size={20} color="#fff" />
        </div>
      </div>

      {/* Notification Banner */}
      <div className="notification-banner">
        <p>033***5 đã rút 80.000.000 đ</p>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <img src={bankImage} alt="MB Bank" className="main-image" />
      </div>

      {/* Main Action Button */}
      <div className="main-action-button">
        <button className="action-button">Gửi tiết kiệm</button>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <div className="nav-item">
          <FaWallet size={22} />
          <p>Ví tiền</p>
        </div>
        <div className="nav-item active">
          <div className="home-icon-container">
            <FaHome size={22} />
          </div>
          <p>Trang chủ</p>
        </div>
        <div className="nav-item" onClick={handleLogout}>
          <FaUser size={22} />
          <p>Hồ sơ</p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
