import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import boCongThuong from "../../assets/Home/bocothuong.png";
import carousel1 from "../../assets/Home/carousel/1.jpg";
import carousel2 from "../../assets/Home/carousel/2.jpg";
import carousel3 from "../../assets/Home/carousel/3.jpg";
import bankImage from "../../assets/Home/home.png";
import { useAuth } from "../../context/AuthContext";
import BottomNavigation from "../common/BottomNavigation";
import "./HomeScreen.css";

const HomeScreen = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [animateItems, setAnimateItems] = useState([false, false, false]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [notificationIndex, setNotificationIndex] = useState(0);

  // Sample notification data
  const notificationData = [
    "033***5 đã rút 80.000.000 đ",
    "091***6 đã vay thành công 150.000.000 đ",
    "087***2 đã nhận 200.000.000 đ sau 30 phút",
    "054***8 đã được duyệt khoản vay 500.000.000 đ",
    "076***3 đã thanh toán khoản vay thành công",
  ];

  // Carousel images
  const carouselImages = [carousel1, carousel2, carousel3];

  const handleLogout = () => {
    // Use the logout function from AuthContext
    logout();
    // Navigate to login page
    navigate("/login");
  };

  const handleBenefitClick = (index) => {
    // Create a new array with the clicked index set to true
    const newAnimateItems = [...animateItems];
    newAnimateItems[index] = true;
    setAnimateItems(newAnimateItems);

    // Reset animation after it completes
    setTimeout(() => {
      const resetItems = [...newAnimateItems];
      resetItems[index] = false;
      setAnimateItems(resetItems);
    }, 500); // Adjusted animation duration for new keyframes
  };

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      goToNextSlide();
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Auto-rotate notifications
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      setNotificationIndex(
        (prevIndex) => (prevIndex + 1) % notificationData.length
      );
    }, 3000); // Change notification every 3 seconds

    return () => clearInterval(notificationInterval);
  }, [notificationData.length]);

  const goToNextSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide + 1) % carouselImages.length);
  };

  // Handle manual slide change
  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  const handleLoanButtonClick = () => {
    navigate("/loan"); // Navigate to loan page
  };

  const handleNotificationClick = () => {
    navigate("/notifications"); // Navigate to notifications page
  };

  // Get the display name - show fullName if available, otherwise phone number
  const getDisplayName = () => {
    if (user?.fullName) {
      return user.fullName;
    } else if (user?.personalInfo?.fullName) {
      return user.personalInfo.fullName;
    } else {
      return user?.phone || "Người dùng";
    }
  };

  return (
    <div className="home-container">
      {/* Header */}
      <div className="header">
        <div className="greeting">
          <p>Xin chào,</p>
          <p className="phone-number">{getDisplayName()}</p>
        </div>
        <div className="notification-icon" onClick={handleNotificationClick}>
          <FaBell size={20} color="#fff" />
        </div>
      </div>

      {/* Notification Banner */}
      <div className="notification-banner">
        <p>{notificationData[notificationIndex]}</p>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <img src={bankImage} alt="MB Bank" className="main-image" />
      </div>

      {/* Loan Section */}
      <div className="loan-section">
        {/* Loan Registration Button */}
        <div className="loan-button-container">
          <button className="loan-button" onClick={handleLoanButtonClick}>
            Đăng ký khoản vay
          </button>
        </div>

        {/* Loan Benefits */}
        <div className="loan-benefits">
          <div
            className={`benefit-item ${animateItems[0] ? "animate" : ""}`}
            onClick={() => handleBenefitClick(0)}
          >
            <span className="benefit-text">
              Thủ tục vay nhanh chóng, đơn giản
            </span>
            <div className="orange">
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="alert"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M512 244c176.18 0 319 142.82 319 319v233a32 32 0 01-32 32H225a32 32 0 01-32-32V563c0-176.18 142.82-319 319-319zM484 68h56a8 8 0 018 8v96a8 8 0 01-8 8h-56a8 8 0 01-8-8V76a8 8 0 018-8zM177.25 191.66a8 8 0 0111.32 0l67.88 67.88a8 8 0 010 11.31l-39.6 39.6a8 8 0 01-11.31 0l-67.88-67.88a8 8 0 010-11.31l39.6-39.6zm669.6 0l39.6 39.6a8 8 0 010 11.3l-67.88 67.9a8 8 0 01-11.32 0l-39.6-39.6a8 8 0 010-11.32l67.89-67.88a8 8 0 0111.31 0zM192 892h640a32 32 0 0132 32v24a8 8 0 01-8 8H168a8 8 0 01-8-8v-24a32 32 0 0132-32zm148-317v253h64V575h-64z"></path>
              </svg>
            </div>
          </div>

          <div
            className={`benefit-item ${animateItems[1] ? "animate" : ""}`}
            onClick={() => handleBenefitClick(1)}
          >
            <span className="benefit-text">Hạn mức vay lên đến 500tr VNĐ</span>
            <div className="green">
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="dashboard"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M924.8 385.6a446.7 446.7 0 00-96-142.4 446.7 446.7 0 00-142.4-96C631.1 123.8 572.5 112 512 112s-119.1 11.8-174.4 35.2a446.7 446.7 0 00-142.4 96 446.7 446.7 0 00-96 142.4C75.8 440.9 64 499.5 64 560c0 132.7 58.3 257.7 159.9 343.1l1.7 1.4c5.8 4.8 13.1 7.5 20.6 7.5h531.7c7.5 0 14.8-2.7 20.6-7.5l1.7-1.4C901.7 817.7 960 692.7 960 560c0-60.5-11.9-119.1-35.2-174.4zM482 232c0-4.4 3.6-8 8-8h44c4.4 0 8 3.6 8 8v80c0 4.4-3.6 8-8 8h-44c-4.4 0-8-3.6-8-8v-80zM270 582c0 4.4-3.6 8-8 8h-80c-4.4 0-8-3.6-8-8v-44c0-4.4 3.6-8 8-8h80c4.4 0 8 3.6 8 8v44zm90.7-204.5l-31.1 31.1a8.03 8.03 0 01-11.3 0L261.7 352a8.03 8.03 0 010-11.3l31.1-31.1c3.1-3.1 8.2-3.1 11.3 0l56.6 56.6c3.1 3.1 3.1 8.2 0 11.3zm291.1 83.6l-84.5 84.5c5 18.7.2 39.4-14.5 54.1a55.95 55.95 0 01-79.2 0 55.95 55.95 0 010-79.2 55.87 55.87 0 0154.1-14.5l84.5-84.5c3.1-3.1 8.2-3.1 11.3 0l28.3 28.3c3.1 3.1 3.1 8.1 0 11.3zm43-52.4l-31.1-31.1a8.03 8.03 0 010-11.3l56.6-56.6c3.1-3.1 8.2-3.1 11.3 0l31.1 31.1c3.1 3.1 3.1 8.2 0 11.3l-56.6 56.6a8.03 8.03 0 01-11.3 0zM846 582c0 4.4-3.6 8-8 8h-80c-4.4 0-8-3.6-8-8v-44c0-4.4 3.6-8 8-8h80c4.4 0 8 3.6 8 8v44z"></path>
              </svg>
            </div>
          </div>

          <div
            className={`benefit-item ${animateItems[2] ? "animate" : ""}`}
            onClick={() => handleBenefitClick(2)}
          >
            <span className="benefit-text">
              Nhận tiền chỉ sau 30 phút làm hồ sơ
            </span>
            <div className="blue">
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="sliders"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M904 296h-66v-96c0-4.4-3.6-8-8-8h-52c-4.4 0-8 3.6-8 8v96h-66c-4.4 0-8 3.6-8 8v416c0 4.4 3.6 8 8 8h66v96c0 4.4 3.6 8 8 8h52c4.4 0 8-3.6 8-8v-96h66c4.4 0 8-3.6 8-8V304c0-4.4-3.6-8-8-8zm-584-72h-66v-56c0-4.4-3.6-8-8-8h-52c-4.4 0-8 3.6-8 8v56h-66c-4.4 0-8 3.6-8 8v560c0 4.4 3.6 8 8 8h66v56c0 4.4 3.6 8 8 8h52c4.4 0 8-3.6 8-8v-56h66c4.4 0 8-3.6 8-8V232c0-4.4-3.6-8-8-8zm292 180h-66V232c0-4.4-3.6-8-8-8h-52c-4.4 0-8 3.6-8 8v172h-66c-4.4 0-8 3.6-8 8v200c0 4.4 3.6 8 8 8h66v172c0 4.4 3.6 8 8 8h52c4.4 0 8-3.6 8-8V620h66c4.4 0 8-3.6 8-8V412c0-4.4-3.6-8-8-8z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Image Carousel */}
        <div className="carousel-container">
          <div className="carousel">
            {carouselImages.map((image, index) => {
              let slideClass = "";

              if (index === activeSlide) {
                slideClass = "active";
              } else if (
                index ===
                (activeSlide - 1 + carouselImages.length) %
                  carouselImages.length
              ) {
                slideClass = "prev";
              }

              return (
                <div key={index} className={`carousel-slide ${slideClass}`}>
                  <img src={image} alt={`Carousel slide ${index + 1}`} />
                </div>
              );
            })}
          </div>

          {/* Carousel Indicators/Dots */}
          <div className="carousel-indicators">
            {carouselImages.map((_, index) => (
              <div
                key={index}
                className={`carousel-dot ${
                  index === activeSlide ? "active" : ""
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="certification">
            <img
              src={boCongThuong}
              alt="Certification"
              className="certification-logo"
            />
          </div>
          <div className="copyright">
            © Bản quyền thuộc về <br /> Ngân hàng MB Quân đội
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activePage="home" />
    </div>
  );
};

export default HomeScreen;
