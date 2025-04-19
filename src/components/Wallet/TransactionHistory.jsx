import React from "react";
import { useNavigate } from "react-router-dom";
import emptyIcon from "../../assets/Home/thongbao.png";
import "./TransactionHistory.css";

const TransactionHistory = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="transaction-history-container">
      {/* Header */}
      <div className="transaction-header">
        <button className="back-button" onClick={handleBack}>
          <svg
            viewBox="64 64 896 896"
            focusable="false"
            data-icon="arrow-left"
            width="1em"
            height="1em"
            fill="currentColor"
          >
            <path d="M872 474H286.9l350.2-304c5.6-4.9 2.2-14-5.2-14h-88.5c-3.9 0-7.6 1.4-10.5 3.9L155 487.8a31.96 31.96 0 000 48.3L535.1 866c1.5 1.3 3.3 2 5.2 2h91.5c7.4 0 10.8-9.2 5.2-14L286.9 550H872c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"></path>
          </svg>
        </button>
        <h1>Lịch sử giao dịch</h1>
      </div>

      {/* Empty state */}
      <div className="empty-state">
        <img src={emptyIcon} alt="No transactions" className="empty-icon" />
        <p className="empty-text">Chưa có dữ liệu</p>
      </div>
    </div>
  );
};

export default TransactionHistory;
