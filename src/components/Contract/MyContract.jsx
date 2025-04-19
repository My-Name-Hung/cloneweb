import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import thongbaoIcon from "../../assets/Home/thongbao.png";
import { useAuth } from "../../context/AuthContext";
import "./MyContract.css";

const MyContract = () => {
  const navigate = useNavigate();
  const { user, getUserContracts } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to fetch contracts
    const fetchContracts = async () => {
      setIsLoading(true);
      try {
        if (!user || !user.id) {
          console.log("No user logged in, cannot fetch contracts");
          setContracts([]);
          setIsLoading(false);
          return;
        }

        // Get contracts from auth context (which tries API first, then localStorage)
        const result = await getUserContracts();

        if (result.success && result.contracts) {
          console.log("Found contracts for user:", user.id, result.contracts);
          setContracts(result.contracts);
        } else {
          // If no contracts found through auth context, check localStorage directly
          console.log(
            "No contracts found through auth context, checking localStorage"
          );
          const userContractsKey = `userContracts_${user.id}`;
          const savedContracts = localStorage.getItem(userContractsKey);

          if (savedContracts) {
            console.log("Found contracts in localStorage for user:", user.id);
            setContracts(JSON.parse(savedContracts));
          } else {
            console.log("No contracts found for user:", user.id);
            setContracts([]);
          }
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
        setContracts([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Short delay to simulate loading
    const timer = setTimeout(() => {
      fetchContracts();
    }, 500);

    return () => clearTimeout(timer);
  }, [user, getUserContracts]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleRegisterClick = () => {
    navigate("/loan");
  };

  if (isLoading) {
    return (
      <div className="contract-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="contract-container">
      {/* Header */}
      <div className="contract-header">
        <button className="back-button" onClick={handleBackClick}>
          <svg
            viewBox="64 64 896 896"
            focusable="false"
            data-icon="left"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
          </svg>
        </button>
        <h1 className="header-title">Khoản vay</h1>
      </div>

      {/* Content */}
      {contracts.length === 0 ? (
        <div className="empty-contract">
          <div className="empty-icon">
            <img
              src={thongbaoIcon}
              alt="Không có khoản vay"
              width="120"
              height="120"
            />
          </div>
          <p className="empty-text">Bạn chưa có khoản vay nào</p>
          <button className="register-button" onClick={handleRegisterClick}>
            Đăng ký ngay
          </button>
        </div>
      ) : (
        <div className="contract-list">
          {contracts.map((contract, index) => (
            <div key={index} className="contract-item">
              <h3>Mã hợp đồng: {contract.contractId}</h3>
              <div className="contract-info">
                <div className="info-row">
                  <span className="info-label">Số tiền vay:</span>
                  <span className="info-value">
                    {contract.loanAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Thời hạn vay:</span>
                  <span className="info-value">{contract.loanTerm} tháng</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngân hàng:</span>
                  <span className="info-value">{contract.bankName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày tạo:</span>
                  <span className="info-value">
                    {contract.createdDate} {contract.createdTime}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyContract;
