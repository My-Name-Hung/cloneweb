import React from "react";
import { useNavigate } from "react-router-dom";
import "./BottomNavigation.css";

const BottomNavigation = ({ activePage }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="bottom-nav">
      <div
        className={`nav-item ${activePage === "wallet" ? "active" : ""}`}
        onClick={() => handleNavigation("/wallet")}
      >
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
        <p className={activePage === "wallet" ? "active-text" : ""}>Ví tiền</p>
      </div>

      <div
        className={`nav-item ${activePage === "home" ? "active" : ""}`}
        onClick={() => handleNavigation("/home")}
      >
        <div className="nav-icon">
          <svg fill="none" viewBox="0 0 24 24" width="22" height="22">
            <path
              d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"
              stroke={activePage === "home" ? "#0039a6" : "currentColor"}
              strokeWidth="0.5"
              fill={activePage === "home" ? "#0039a6" : "currentColor"}
            />
          </svg>
        </div>
        <p className={activePage === "home" ? "active-text" : ""}>Trang chủ</p>
      </div>

      <div
        className={`nav-item ${activePage === "profile" ? "active" : ""}`}
        onClick={() => handleNavigation("/profile")}
      >
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
        <p className={activePage === "profile" ? "active-text" : ""}>Hồ sơ</p>
      </div>
    </div>
  );
};

export default BottomNavigation;
