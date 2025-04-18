import React from "react";
import MBLogo from "../../assets/logo/mblogo.png";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <img src={MBLogo} alt="MB Logo" className="loading-logo" />
      </div>
    </div>
  );
};

export default LoadingScreen;
