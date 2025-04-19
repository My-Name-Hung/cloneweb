import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import boCongThuong from "../../assets/Home/bocothuong.png";
import carousel1 from "../../assets/Home/carousel/1.jpg";
import carousel2 from "../../assets/Home/carousel/2.jpg";
import carousel3 from "../../assets/Home/carousel/3.jpg";
import bankImage from "../../assets/Home/home.png";
import "./HomeScreen.css";

const HomeScreen = ({ user }) => {
  const navigate = useNavigate();
  const [animateItems, setAnimateItems] = useState([false, false, false]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [notificationIndex, setNotificationIndex] = useState(0);

  // Dữ liệu mẫu cho thông báo
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
    // Xóa session storage
    sessionStorage.removeItem("user");
    // Chuyển hướng về trang login
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

  // Thay đổi thông báo tự động
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      setNotificationIndex(
        (prevIndex) => (prevIndex + 1) % notificationData.length
      );
    }, 3000); // Thay đổi thông báo mỗi 3 giây

    return () => clearInterval(notificationInterval);
  }, [notificationData.length]);

  const goToNextSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide + 1) % carouselImages.length);
  };

  const goToPrevSlide = () => {
    setActiveSlide((prevSlide) =>
      prevSlide === 0 ? carouselImages.length - 1 : prevSlide - 1
    );
  };

  // Handle manual slide change
  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  const handleLoanButtonClick = () => {
    navigate("/loan"); // Điều hướng đến trang vay
  };

  const handleNotificationClick = () => {
    navigate("/notifications"); // Chuyển đến trang thông báo
  };

  return (
    <div className="home-container">
      {/* Header */}
      <div className="header">
        <div className="greeting">
          <p>Xin chào,</p>
          <p className="phone-number">{user?.phone || "0705007516"}</p>
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
      <div className="bottom-nav">
        <div className="nav-item">
          <div className="nav-icon">
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="credit-card"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-792 72h752v120H136V232zm752 560H136V440h752v352zm-237-64h165c4.4 0 8-3.6 8-8v-72c0-4.4-3.6-8-8-8H651c-4.4 0-8 3.6-8 8v72c0 4.4 3.6 8 8 8z"></path>
            </svg>
          </div>
          <p>Ví tiền</p>
        </div>
        <div className="nav-item active">
          <div className="nav-icon">
            <svg fill="none" viewBox="0 0 24 24" width="22" height="22">
              <path
                d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"
                stroke="#0039a6"
                strokeWidth="0.5"
                fill="#0039a6"
              />
            </svg>
          </div>
          <p>Trang chủ</p>
        </div>
        <div className="nav-item" onClick={handleLogout}>
          <div className="nav-icon">
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="user"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path>
            </svg>
          </div>
          <p>Hồ sơ</p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
