import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkVerificationStatus } from "../../database/storageService";
import "./LoanStyles.css";

const LoanSelectionScreen = () => {
  const navigate = useNavigate();
  const [loanAmount, setLoanAmount] = useState("0");
  const [loanTerm, setLoanTerm] = useState("6");
  const [loanDate] = useState("18/4/2025");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const detailsLinkRef = useRef(null);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const dropdownRef = useRef(null);

  // Calculate the first payment based on correct formula
  const calculatePayment = (principal, termMonths, annualInterestRate) => {
    try {
      // Convert from formatted string (with dots) to number if needed
      let amount = principal;
      if (typeof principal === "string") {
        // Remove dots and convert to number
        amount = parseFloat(principal.replace(/\./g, ""));
      }

      // Convert annual interest rate to monthly
      const monthlyInterestRate = annualInterestRate / 12;

      // Calculate monthly interest payment
      const monthlyInterestPayment = amount * monthlyInterestRate;

      // Calculate principal payment per month
      const monthlyPrincipalPayment = amount / termMonths;

      // Total monthly payment
      const totalMonthlyPayment =
        monthlyPrincipalPayment + monthlyInterestPayment;

      return Math.round(totalMonthlyPayment);
    } catch (error) {
      console.error("Error calculating payment:", error);
      return 0;
    }
  };

  // Remove error notification after 3 seconds
  useEffect(() => {
    let timer;
    if (showError) {
      timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [showError]);

  // Validate loan amount
  const validateLoanAmount = (value) => {
    // If the field is empty, don't show error
    if (!value) return true;

    // Remove dots from formatted number
    const numericValue = parseFloat(value.replace(/\./g, ""));

    // Check if it's a valid number
    if (isNaN(numericValue)) {
      setErrorMessage("Số tiền vay không hợp lệ");
      setShowError(true);
      return false;
    }

    // Check if amount is within range
    if (numericValue < 20000000) {
      setErrorMessage("Hạn mức vay trong khoảng 20tr đến 500tr đồng.");
      setShowError(true);
      return false;
    }

    if (numericValue > 500000000) {
      setErrorMessage("Hạn mức vay trong khoảng 20tr đến 500tr đồng.");
      setShowError(true);
      return false;
    }

    return true;
  };

  // Handle loan amount change with validation
  const handleLoanAmountChange = (e) => {
    const value = e.target.value;

    // Remove any non-digit characters
    const numericValue = value.replace(/\D/g, "");

    // Set "0" if the input is empty
    if (!numericValue) {
      setLoanAmount("0");
      return;
    }

    // Format with dots for thousands separator
    const formattedValue = formatCurrency(numericValue);

    setLoanAmount(formattedValue);
  };

  // Validate on blur (when user leaves the input field)
  const handleLoanAmountBlur = () => {
    validateLoanAmount(loanAmount);
  };

  // Calculate the first payment
  const calculateFirstPayment = () => {
    try {
      // Get loan amount (use 0 as default instead of 222222222)
      const amount = loanAmount ? loanAmount.replace(/\./g, "") : "0";
      const principal = parseFloat(amount);

      // Term in months
      const termMonths = parseInt(loanTerm);

      // Annual interest rate (1%)
      const annualInterestRate = 0.12;

      if (isNaN(principal) || isNaN(termMonths) || termMonths === 0) {
        return "0";
      }

      const payment = calculatePayment(
        principal,
        termMonths,
        annualInterestRate
      );
      return formatCurrency(payment);
    } catch (error) {
      console.error("Error calculating first payment:", error);
      return "0";
    }
  };

  // Generate payment schedule data
  const generatePaymentSchedule = () => {
    const payments = [];

    // Get loan details
    const amount = loanAmount ? parseFloat(loanAmount.replace(/\./g, "")) : 0;
    const termMonths = parseInt(loanTerm);
    const annualInterestRate = 0.12; // 1%
    const monthlyInterestRate = annualInterestRate / 12;

    // Generate payment schedule
    for (let i = 1; i <= termMonths; i++) {
      // Calculate month display
      let monthDisplay;
      if (i === 1) monthDisplay = "5";
      else if (i === 2) monthDisplay = "6";
      else if (i === 3) monthDisplay = "7";
      else if (i === 4) monthDisplay = "8";
      else if (i === 5) monthDisplay = "9";
      else if (i === 6) monthDisplay = "10";
      else {
        // For months beyond what's shown in the image
        const monthIndex = i % 12;
        const month = monthIndex === 0 ? 12 : monthIndex + 4; // Start from May (5)
        monthDisplay = month > 12 ? month - 12 : month;
      }

      // Calculate remaining principal for this month
      const remainingPrincipal = amount - (amount / termMonths) * (i - 1);

      // Calculate interest for this month
      const interestPayment = remainingPrincipal * monthlyInterestRate;

      // Calculate principal payment for this month
      const principalPayment = amount / termMonths;

      // Total payment for this month
      const totalPayment = principalPayment + interestPayment;

      const payment = {
        ki: `Kì thứ ${i}`,
        amount: Math.round(totalPayment),
        date: `18 - ${monthDisplay}`,
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
      };

      payments.push(payment);
    }

    return payments;
  };

  useEffect(() => {
    // Recalculate payment when loan amount or term changes
    if (loanAmount || loanTerm) {
      // The payment will be automatically calculated when needed
      console.log("Loan details updated, payment will be recalculated");
    }
  }, [loanAmount, loanTerm]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const getDisplayAmount = () => {
    return loanAmount ? formatCurrency(loanAmount) : "0";
  };

  const toggleDropdown = (e) => {
    // Ngăn sự kiện lan tỏa đến các phần tử cha
    if (e) e.stopPropagation();

    console.log("Toggle dropdown called, current state:", dropdownOpen);

    // Sử dụng functional update để đảm bảo luôn có giá trị state mới nhất
    setDropdownOpen((prevState) => {
      console.log("Setting dropdown to:", !prevState);
      return !prevState;
    });
  };

  const selectTerm = (term) => {
    console.log("Selecting term:", term);
    setLoanTerm(term);
    setTimeout(() => {
      setDropdownOpen(false);
    }, 10);
  };

  const openPaymentModal = () => {
    // Set custom animation origin if possible
    if (detailsLinkRef.current) {
      const linkRect = detailsLinkRef.current.getBoundingClientRect();
      const modalRoot = document.documentElement;
      const originX =
        ((linkRect.left + linkRect.width / 2) / modalRoot.clientWidth) * 100;
      const originY =
        ((linkRect.top + linkRect.height / 2) / modalRoot.clientHeight) * 100;

      // Set custom property for animation origin
      document.documentElement.style.setProperty(
        "--modal-origin-x",
        `${originX}%`
      );
      document.documentElement.style.setProperty(
        "--modal-origin-y",
        `${originY}%`
      );
    }

    setIsModalClosing(false);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    // Start closing animation
    setIsModalClosing(true);

    // Wait for animation to complete before removing modal
    setTimeout(() => {
      setShowPaymentModal(false);
      setIsModalClosing(false);
    }, 300); // Match this with the animation duration
  };

  const openConfirmModal = () => {
    // Validate loan amount before showing confirmation
    if (validateLoanAmount(loanAmount)) {
      console.log("Opening confirm modal");
      setShowConfirmModal(true);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const handleLoanConfirmation = async () => {
    try {
      // Get loanAmount and loanTerm để truyền vào state
      const loanAmount = getDisplayAmount();

      // Lưu thông tin khoản vay vào localStorage để có thể truy cập từ các trang khác
      localStorage.setItem(
        "loanData",
        JSON.stringify({
          loanAmount: loanAmount === "0" ? "0" : loanAmount,
          loanTerm: loanTerm,
          loanDate: loanDate,
        })
      );

      // Sửa cách lấy thông tin user từ localStorage
      const userData = JSON.parse(localStorage.getItem("userData")) || {};

      // Kiểm tra đăng nhập với key chính xác
      const userId = userData.id || userData._id;

      if (!userId) {
        console.log("Không tìm thấy ID người dùng trong userData:", userData);
        navigate("/login");
        return;
      }

      // Get API URL - Thêm dòng này vì bị thiếu khai báo API_URL
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      try {
        // Kiểm tra thông tin xác minh của user từ API
        console.log("Đang kiểm tra API với userId:", userId);

        const [profileRes, bankInfoRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/${userId}/profile`),
          axios.get(`${API_URL}/api/users/${userId}/bank-info`),
        ]);

        console.log("Kết quả từ API - profile:", profileRes.data);
        console.log("Kết quả từ API - bankInfo:", bankInfoRes.data);

        // Kiểm tra xem user đã có đầy đủ thông tin chưa
        const hasPersonalInfo =
          profileRes.data.success &&
          profileRes.data.user?.personalInfo?.idNumber &&
          profileRes.data.user?.fullName;

        const hasBankInfo =
          bankInfoRes.data.success &&
          bankInfoRes.data.bankInfo?.accountNumber &&
          bankInfoRes.data.bankInfo?.bank;

        // CẬP NHẬT THÔNG TIN NGƯỜI DÙNG VỚI BANKINFO TỪ SERVER
        if (bankInfoRes.data.success && bankInfoRes.data.bankInfo) {
          // Cập nhật userData trong localStorage với thông tin ngân hàng mới nhất
          const updatedUserData = {
            ...userData,
            bankInfo: bankInfoRes.data.bankInfo,
          };

          console.log("Cập nhật userData vào localStorage:", updatedUserData);
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
        }

        if (hasPersonalInfo && hasBankInfo) {
          // Nếu đã có đầy đủ thông tin, điều hướng trực tiếp đến trang xác nhận khoản vay
          console.log(
            "Đã xác minh đầy đủ, chuyển đến trang xác nhận khoản vay"
          );
          navigate("/loan-confirmation", {
            state: {
              loanAmount: loanAmount,
              loanTerm: loanTerm,
              loanDate: loanDate,
            },
          });
        } else if (hasPersonalInfo) {
          // Có thông tin cá nhân nhưng chưa có thông tin ngân hàng
          console.log(
            "Chưa có thông tin ngân hàng, chuyển đến trang thông tin ngân hàng"
          );
          navigate("/bank-info");
        } else {
          // Chưa có thông tin cá nhân
          console.log(
            "Chưa có thông tin cá nhân, chuyển đến trang thông tin cá nhân"
          );
          navigate("/personal-info");
        }
      } catch (apiError) {
        console.error("Lỗi khi kiểm tra thông tin xác minh API:", apiError);

        // Force kiểm tra lại từ API nếu nhận thấy có bankInfo
        if (apiError.response?.status === 404) {
          console.log("API báo không tìm thấy user, kiểm tra từ localStorage");
        }

        // Kiểm tra từ localStorage nếu API fails
        checkUserVerificationFromLocalStorage();
      }
    } catch (error) {
      console.error("Lỗi chung:", error);

      // Fallback nếu có lỗi
      checkUserVerificationFromLocalStorage();
    }
  };

  // Tương tự, cập nhật hàm checkUserVerificationFromLocalStorage
  const checkUserVerificationFromLocalStorage = () => {
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    console.log("Kiểm tra thông tin từ localStorage:", userData);

    // Sửa ĐIỀU KIỆN KIỂM TRA - LỖI ở đây!
    // ⚠️ Trong dữ liệu của bạn, fullName nằm ở userData.fullName (ngoài personalInfo)
    // Không phải userData.personalInfo.fullName
    const hasPersonalInfo =
      userData.personalInfo &&
      userData.personalInfo.idNumber &&
      userData.fullName; // Sửa từ userData.personalInfo.fullName -> userData.fullName

    // Check if bankInfo exists
    const hasBankInfo =
      userData.bankInfo &&
      userData.bankInfo.accountNumber &&
      userData.bankInfo.bank;

    if (hasPersonalInfo && hasBankInfo) {
      // Đã có đầy đủ thông tin, điều hướng trực tiếp đến trang xác nhận khoản vay
      console.log(
        "Đã xác minh đầy đủ (từ localStorage), chuyển đến trang xác nhận khoản vay"
      );
      navigate("/loan-confirmation", {
        state: {
          loanAmount: getDisplayAmount(),
          loanTerm: loanTerm,
          loanDate: loanDate,
        },
      });
    } else if (hasPersonalInfo) {
      // User has already filled personal info, go to bank info
      console.log(
        "Chưa có thông tin ngân hàng (từ localStorage), chuyển đến trang thông tin ngân hàng"
      );
      navigate("/bank-info");
    } else {
      // User needs to fill personal info first
      console.log(
        "Chưa có thông tin cá nhân (từ localStorage), chuyển đến trang thông tin cá nhân"
      );
      navigate("/personal-info");
    }
  };

  // In a real app, this would check with the server if documents exist
  useEffect(() => {
    // Simulating an API call to check if documents exist
    const checkDocumentsStatus = async () => {
      try {
        // Get a default userId (in a real app this would come from authentication)
        const userId = "user123";

        // Check if user has uploaded all required verification documents
        const isVerified = await checkVerificationStatus(userId);

        // Update state with verification status
        setDocumentsUploaded(isVerified);

        console.log(
          `User verification status: ${
            isVerified ? "Verified" : "Not verified"
          }`
        );
      } catch (error) {
        console.error("Error checking documents status:", error);
        setDocumentsUploaded(false);
      }
    };

    checkDocumentsStatus();
  }, []);

  // Thêm useEffect để xử lý click bên ngoài dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Nếu click ra ngoài dropdown-container, đóng dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    // Thêm event listener vào document
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener khi component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Giải pháp khẩn cấp - component tạm thời
  function CustomDropdown({ value, options, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(event) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div
        className="custom-dropdown"
        ref={dropdownRef}
        style={{ position: "relative", width: "20%"}}
      >
        <div
          className="custom-dropdown-header"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: "10px 15px",
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #ddd",
            color: "black",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>{value} tháng</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 10l5 5 5-5"
              stroke="#999"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && (
          <div
            className="custom-dropdown-list"
            style={{
              position: "absolute",
              top: "calc(100% + 5px)",
              left: 0,
              width: "100%",
              color: "black",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              zIndex: 9999,
              border: "1px solid #ddd",
            }}
          >
            {options.map((option) => (
              <div
                key={option}
                className={option === value ? "active" : ""}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 15px",
                  cursor: "pointer",
                  backgroundColor: option === value ? "#e6f7ff" : "white",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                {option} tháng
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="loan-page-container">
      {/* Error notification */}
      {showError && (
        <div className="error-notification">
          <div className="error-icon">×</div>
          <div className="error-message">{errorMessage}</div>
        </div>
      )}

      <div className="loan-selection-container">
        <header className="loan-header">
          <button className="back-button" onClick={handleBackClick}>
            <svg
              width="28"
              height="28"
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
          <h1 className="header-title">Chọn khoản vay</h1>
        </header>

        <div className="loan-form">
          <div className="input-group">
            <label htmlFor="loan-amount">Số tiền vay</label>
            <input
              id="loan-amount"
              type="text"
              value={loanAmount}
              onChange={handleLoanAmountChange}
              onBlur={handleLoanAmountBlur}
              className="loan-amount-input"
              placeholder="Nhập số tiền cần vay"
            />
            <div className="loan-range">
              <span>Từ 20.000.000đ</span>
              <span>Đến 500.000.000đ</span>
            </div>
          </div>

          <div className="dropdown">
            <label>Chọn thời hạn vay</label>
            <CustomDropdown
              value={loanTerm}
              options={["6", "12", "18", "24", "36", "48", "60"]}
              onChange={setLoanTerm}
            />
          </div>
        </div>
      </div>

      <div className="loan-info-section">
        <div className="loan-info-card">
          <h2 className="loan-info-title">Thông tin khoản vay</h2>

          <div className="loan-info-row">
            <span className="loan-info-label">Số tiền</span>
            <span className="loan-info-value">{getDisplayAmount()} đ</span>
          </div>

          <div className="loan-info-row">
            <span className="loan-info-label">Thời hạn vay</span>
            <span className="loan-info-value">{loanTerm} tháng</span>
          </div>

          <div className="loan-info-row">
            <span className="loan-info-label">Ngày vay</span>
            <span className="loan-info-value">{loanDate}</span>
          </div>

          <div className="loan-info-row">
            <span className="loan-info-label">Hình thức thanh toán</span>
            <span className="loan-info-value">Trả góp mỗi tháng</span>
          </div>
        </div>

        <div className="loan-details-container">
          <div className="payment-info-row">
            <span className="payment-info-label">Trả nợ kì đầu</span>
            <span className="payment-info-value">
              {calculateFirstPayment()} VND
            </span>
          </div>

          <div className="payment-info-row">
            <span className="payment-info-label">Lãi suất hàng tháng</span>
            <span className="payment-info-value">1% (12%/năm)</span>
          </div>

          <div className="loan-details-link">
            <span ref={detailsLinkRef} onClick={openPaymentModal}>
              Chi tiết trả nợ
            </span>
          </div>
        </div>

        <div className="confirm-loan-container">
          <button
            className="confirm-loan-button"
            onClick={() => {
              console.log("Button clicked");
              openConfirmModal();
            }}
          >
            Xác nhận khoản vay
          </button>

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="confirm-modal-overlay">
              <div
                className="confirm-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="confirm-modal-content">
                  <div className="confirm-modal-message">
                    <div className="confirm-icon">!</div>
                    <div className="confirm-text">
                      Đồng ý vay {getDisplayAmount()} VND kì hạn {loanTerm}{" "}
                      tháng ?
                    </div>
                  </div>
                  <div className="confirm-modal-buttons">
                    <button
                      className="cancel-button"
                      onClick={closeConfirmModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="confirm-button"
                      onClick={handleLoanConfirmation}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && (
        <div
          ref={overlayRef}
          className={`payment-modal-overlay ${isModalClosing ? "closing" : ""}`}
          onClick={closePaymentModal}
        >
          <div
            ref={modalRef}
            className={`payment-modal ${isModalClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-content">
              <div className="payment-table-header">
                <div className="header-cell">Kỳ</div>
                <div className="header-cell">Số tiền</div>
                <div className="header-cell">Ngày đóng</div>
              </div>

              <div className="payment-table-body">
                {generatePaymentSchedule().map((payment, index) => (
                  <div className="payment-table-row" key={index}>
                    <div className="col1">{payment.ki}</div>
                    <div className="table-cell">
                      <div className="payment-amount">
                        {formatCurrency(payment.amount.toString())}
                      </div>
                      <div className="payment-details">
                        {/* <span className="principal">
                          Gốc: {formatCurrency(payment.principal.toString())}
                        </span>
                        <span className="interest">
                          Lãi: {formatCurrency(payment.interest.toString())}
                        </span> */}
                      </div>
                    </div>
                    <div className="table-cell">{payment.date}</div>
                  </div>
                ))}
              </div>

              <div className="payment-modal-footer">
                <button className="ok-button" onClick={closePaymentModal}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanSelectionScreen;
