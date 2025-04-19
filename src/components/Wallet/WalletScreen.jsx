import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bankLinkImage from "../../assets/nganhanglienket.jpg"; // Import the banks image
import cardImage from "../../assets/xacminh/bank-card.png"; // Import the bank card image
import { useAuth } from "../../context/AuthContext";
import BottomNavigation from "../common/BottomNavigation";
import "./WalletScreen.css";

// Import bank logos (you'll need to add these to your assets folder)
import acbLogo from "../../assets/banks/acb.png";
import bidvLogo from "../../assets/banks/bidv.png";
import mbLogo from "../../assets/banks/mb.png";
import techcombankLogo from "../../assets/banks/techcombank.png";
import tpbankLogo from "../../assets/banks/tpbank.png";
import vietcombankLogo from "../../assets/banks/vietcombank.png";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

const bankLogos = {
  bidv: bidvLogo,
  mb: mbLogo,
  vcb: vietcombankLogo,
  tcb: techcombankLogo,
  tpb: tpbankLogo,
  acb: acbLogo,
};

const WalletScreen = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bankInfo, setBankInfo] = useState(null);
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState("info"); // "info" or "error"

  useEffect(() => {
    // Fetch bank info from user data
    const fetchBankInfo = async () => {
      setIsLoading(true);
      try {
        if (user && user.bankInfo) {
          setBankInfo(user.bankInfo);
        } else {
          // Default data (for testing)
          setBankInfo({
            bank: "Ngân hàng Đầu tư và Phát triển Việt Nam ( BIDV )",
            accountNumber: "12345678901234",
            accountName: "hung",
            bankId: "bidv",
          });
        }
      } catch (error) {
        console.error("Error fetching bank info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankInfo();
  }, [user]);

  // Format account number to show only last 4 digits
  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return "****";
    const lastFourDigits = accountNumber.slice(-4);
    return `********${lastFourDigits}`;
  };

  // Get bank logo
  const getBankLogo = (bankId) => {
    return bankLogos[bankId] || null;
  };

  const handleWithdrawButtonClick = () => {
    // Show insufficient balance error
    setErrorMessage("Số dư khả dụng không đủ");
    setErrorType("error");
    setShowError(true);

    // Hide error after 3 seconds
    setTimeout(() => {
      setShowError(false);
    }, 3000);
  };

  const toggleWithdrawModal = () => {
    setShowWithdrawModal(!showWithdrawModal);
    if (!showWithdrawModal) {
      setErrorMessage("");
      setShowError(false);
    }
  };

  const handleWithdrawAmountChange = (e) => {
    const value = e.target.value;

    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      // Format as decimal
      let formattedValue = value;

      // If there's a decimal point, ensure it's properly formatted
      if (value.includes(".")) {
        const parts = value.split(".");
        if (parts[1].length > 3) {
          // Limit to 3 decimal places
          formattedValue = `${parts[0]}.${parts[1].substring(0, 3)}`;
        }
      }

      setWithdrawAmount(formattedValue);
    }
  };

  const handleContinue = () => {
    // Handle withdrawal logic
    try {
      // Simulate validation check
      if (parseFloat(withdrawAmount) > 10000) {
        setErrorMessage("Không thể cao hơn mức khả dụng");
        setErrorType("info");
        setShowError(true);
      } else {
        // Process successful withdrawal
        console.log("Processing withdrawal of:", withdrawAmount);
        setShowWithdrawModal(false);
        setErrorMessage("");
        setShowError(false);
      }
    } catch (error) {
      setErrorMessage("Không thể cao hơn mức khả dụng");
      setErrorType("info");
      setShowError(true);
    }
  };

  const goToTransactionHistory = () => {
    navigate("/transaction-history");
  };

  return (
    <div className="wallet-container">
      {/* Error Notification - dynamically styled based on type */}
      {showError && (
        <div className={`notification-banner ${errorType}-notification`}>
          {errorType === "error" ? (
            <div className="error-icon-circle">
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="close"
                width="1em"
                height="1em"
                fill="currentColor"
              >
                <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
              </svg>
            </div>
          ) : (
            <div className="info-icon">
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="info-circle"
                width="1em"
                height="1em"
                fill="currentColor"
              >
                <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
                <path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path>
              </svg>
            </div>
          )}
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="wallet-header">
        <h1>Ví tiền</h1>
      </div>

      {isLoading ? (
        <div className="wallet-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : (
        <>
          {/* Bank card - updated to use the specific image */}
          <div className="bank-card-containers">
            <div className="bank-card">
              <img
                src={cardImage}
                alt="Bank Card"
                className="bank-card-image"
              />
              <div className="bank-card-overlay">
                <div className="card-title">
                  {bankInfo.bankId && (
                    <img
                      src={getBankLogo(bankInfo.bankId)}
                      alt="Bank Logo"
                      className="card-bank-logo"
                    />
                  )}
                </div>
                <div className="bank-card-account-number">
                  {formatAccountNumber(bankInfo.accountNumber)}
                </div>
                <div className="bank-card-account-name">
                  {bankInfo.accountName || "Chưa có thông tin"}
                </div>
              </div>
            </div>
          </div>

          {/* Account balance section */}
          <div className="balance-container">
            <div className="balance-row">
              <div className="balance-label">Số dư ví :</div>
              <div className="balance-value-container">
                <div className="balance-value">0 VND</div>
                <button
                  className="eye-toggle-button"
                  onClick={toggleWithdrawModal}
                  aria-label="Toggle balance visibility"
                >
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="eye-invisible"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                  >
                    <path d="M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z"></path>
                    <path d="M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="balance-history-link">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goToTransactionHistory();
                }}
              >
                Biến động số dư
              </a>
            </div>
          </div>

          {/* Withdraw button */}
          <div className="withdraw-button-container">
            <button
              className="withdraw-button"
              onClick={handleWithdrawButtonClick}
            >
              <span>Rút tiền về tài khoản liên kết</span>
              <span className="download-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>
          </div>

          {/* Linked banks section - Updated to use image */}
          <div className="linked-banks-section">
            <div className="linked-banks-image-container">
              <img
                src={bankLinkImage}
                alt="Các ngân hàng liên kết"
                className="linked-banks-image"
              />
            </div>
          </div>
        </>
      )}

      {/* Withdraw Modal */}
      <div
        className={`modal-overlay ${showWithdrawModal ? "visible" : "hidden"}`}
      >
        <div className="withdraw-modal">
          <div className="modal-header">
            <h2>Rút tiền</h2>
            <button className="close-button" onClick={toggleWithdrawModal}>
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="close"
                width="1em"
                height="1em"
                fill="currentColor"
              >
                <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
              </svg>
            </button>
          </div>
          <div className="modal-content">
            <div className="input-container">
              <input
                type="text"
                value={withdrawAmount}
                onChange={handleWithdrawAmountChange}
                placeholder="Nhập số tiền rút"
                className="withdraw-input"
                inputMode="decimal"
              />
            </div>
            <button className="continue-button" onClick={handleContinue}>
              Tiếp tục
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activePage="wallet" />
    </div>
  );
};

export default WalletScreen;
