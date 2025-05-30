import React from "react";
import { useNavigate } from "react-router-dom";
import "./VerificationAlert.css";

const VerificationAlert = () => {
  const navigate = useNavigate();

  const handleVerifyNow = () => {
    navigate("/verification");
  };

  return (
    <div className="alert-container">
      <div className="alert-content">
        <span className="alert-title">
          <strong>Xác thực tài khoản</strong>
        </span>

        <div className="alert-divider"></div>

        <div className="alert-body">
          <div className="alert-icon-container">
            <span className="alert-icon">
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
            </span>
          </div>

          <div className="alert-message">
            <span>Bổ sung CMND/CCCD và chân dung để hoàn tất định danh</span>
          </div>
        </div>

        <div className="alert-footer">
          <div className="alert-action" onClick={handleVerifyNow}>
            <span>
              <strong>Xác thực ngay</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationAlert;
