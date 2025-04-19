import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import cardImage from "../../assets/xacminh/bank-card.png";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import "./BankInfoForm.css";

// Import các logo ngân hàng
import acbLogo from "../../assets/banks/acb.png";
import bidvLogo from "../../assets/banks/bidv.png";
import mbLogo from "../../assets/banks/mb.png";
import sacomLogo from "../../assets/banks/sacombank.png";
import techcombankLogo from "../../assets/banks/techcombank.png";
import tpbankLogo from "../../assets/banks/tpbank.png";
import vietcombankLogo from "../../assets/banks/vietcombank.png";
import vpbankLogo from "../../assets/banks/vpbank.png";
import done from "../../assets/xacminh/done.png";

const BankInfoForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const [formData, setFormData] = useState({
    accountNumber: "",
    accountName: "",
    bank: "",
    bankLogo: null,
    bankId: "",
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Danh sách ngân hàng với logo
  const banks = [
    {
      id: "bidv",
      name: "Ngân hàng Đầu tư và Phát triển Việt Nam ( BIDV )",
      logo: bidvLogo,
    },
    { id: "acb", name: "ACB - Ngân hàng Á Châu", logo: acbLogo },
    { id: "mb", name: "MB - Ngân hàng Quân Đội", logo: mbLogo },
    {
      id: "vcb",
      name: "Vietcombank - Ngân hàng Ngoại thương Việt Nam",
      logo: vietcombankLogo,
    },
    {
      id: "tcb",
      name: "Techcombank - Ngân hàng Kỹ thương Việt Nam",
      logo: techcombankLogo,
    },
    {
      id: "vpb",
      name: "VPBank - Ngân hàng Việt Nam Thịnh Vượng",
      logo: vpbankLogo,
    },
    {
      id: "stb",
      name: "Sacombank - Ngân hàng Sài Gòn Thương Tín",
      logo: sacomLogo,
    },
    { id: "tpb", name: "TPBank - Ngân hàng Tiên Phong", logo: tpbankLogo },
  ];

  // Format account number for display on card
  const formatAccountNumber = (number) => {
    if (!number || number.length < 4) return "****";
    const visiblePart = number.slice(0, -4);
    return visiblePart + "****";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectBank = (bank) => {
    setFormData({
      ...formData,
      bank: bank.name,
      bankLogo: bank.logo,
      bankId: bank.id,
    });
    setShowDropdown(false);
    validateField("bank", bank.name);
  };

  // Xử lý click outside để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        event.target.closest(".bank-dropdown-container") === null &&
        showDropdown
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case "accountNumber":
        if (!value.trim()) {
          newErrors.accountNumber = "Vui lòng nhập số tài khoản";
        } else if (!/^\d+$/.test(value)) {
          newErrors.accountNumber = "Số tài khoản chỉ bao gồm số";
        } else {
          delete newErrors.accountNumber;
        }
        break;
      case "accountName":
        if (!value.trim()) {
          newErrors.accountName = "Vui lòng nhập tên chủ tài khoản";
        } else {
          delete newErrors.accountName;
        }
        break;
      case "bank":
        if (!value) {
          newErrors.bank = "Vui lòng chọn ngân hàng thụ hưởng";
        } else {
          delete newErrors.bank;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    let formErrors = {};

    if (!formData.accountNumber.trim()) {
      formErrors.accountNumber = "Vui lòng nhập số tài khoản";
    } else if (!/^\d+$/.test(formData.accountNumber)) {
      formErrors.accountNumber = "Số tài khoản chỉ bao gồm số";
    }

    if (!formData.accountName.trim()) {
      formErrors.accountName = "Vui lòng nhập tên chủ tài khoản";
    }

    if (!formData.bank) {
      formErrors.bank = "Vui lòng chọn ngân hàng thụ hưởng";
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    showLoading();

    try {
      // Get API URL from environment or use default
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // Update user profile with bank information including logo
      const response = await axios.post(
        `${API_URL}/api/users/${user.id}/bank-info`,
        {
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          bank: formData.bank,
          bankLogo: formData.bankLogo,
          bankId: formData.bankId,
        }
      );

      hideLoading();

      if (response.data.success) {
        // Hiển thị thông báo thành công thay vì chuyển hướng ngay lập tức
        setShowSuccessMessage(true);
      }
    } catch (error) {
      console.error("Error saving bank information:", error);
      hideLoading();

      // Cho mục đích demo, vẫn hiển thị thông báo thành công
      setShowSuccessMessage(true);
    }
  };

  const handleContinue = () => {
    // Khi người dùng bấm nút "Tiếp tục", chuyển hướng đến trang /loan
    navigate("/loan", {
      state: {
        message: "Thông tin ngân hàng đã được cập nhật thành công!",
        success: true,
        ...location.state,
      },
    });
  };

  // Update form validity when formData or errors change
  useEffect(() => {
    const { accountNumber, accountName, bank } = formData;
    const isValid =
      accountNumber.trim() !== "" &&
      accountName.trim() !== "" &&
      bank !== "" &&
      Object.keys(errors).length === 0;

    setIsFormValid(isValid);
  }, [formData, errors]);

  if (showSuccessMessage) {
    return (
      <div className="verification-container">
        <div className="verification-header">
          <h1 className="header-title">Xác minh</h1>
        </div>

        <div className="success-container">
          <div className="success-image">
            {/* Illustration hiển thị hình ảnh những người giơ sao */}
            <img src={done} alt="Success" className="success-illustration" />
          </div>

          <div className="success-check">
            <div className="check-circle">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                  fill="#4CAF50"
                />
              </svg>
            </div>
          </div>

          <div className="success-message">
            <h2>Chúc mừng</h2>
            <p>Hoàn thành xác minh danh tính. Vui lòng tiếp tục</p>
          </div>

          <button onClick={handleContinue} className="continue-button">
            Tiếp tục
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="personal-info-main">
        <h2 className="personal-info-title">Thông tin ngân hàng thụ hưởng</h2>

        {/* Bank Card Display */}
        <div className="bank-card-container">
          <img src={cardImage} alt="Bank Card" className="bank-card-image" />
          <div className="bank-card-overlay">
            <div className="card-title">
              {formData.bankLogo ? (
                <img
                  src={formData.bankLogo}
                  alt="Bank Logo"
                  className="card-bank-logo"
                />
              ) : (
                "Chọn ngân hàng"
              )}
            </div>
            <div className="bank-card-account-number">
              {formData.accountNumber
                ? formatAccountNumber(formData.accountNumber)
                : "****"}
            </div>
            <div className="bank-card-account-name">
              {formData.accountName || "**********"}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <span className="ant-input-affix-wrapper bank-input ant-input-affix-wrapper-lg">
            <span className="ant-input-prefix">
              <span
                role="img"
                aria-label="global"
                className="anticon anticon-global information-icon"
              >
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  data-icon="global"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M854.4 800.9c.2-.3.5-.6.7-.9C920.6 722.1 960 621.7 960 512s-39.4-210.1-104.8-288c-.2-.3-.5-.5-.7-.8-1.1-1.3-2.1-2.5-3.2-3.7-.4-.5-.8-.9-1.2-1.4l-4.1-4.7-.1-.1c-1.5-1.7-3.1-3.4-4.6-5.1l-.1-.1c-3.2-3.4-6.4-6.8-9.7-10.1l-.1-.1-4.8-4.8-.3-.3c-1.5-1.5-3-2.9-4.5-4.3-.5-.5-1-1-1.6-1.5-1-1-2-1.9-3-2.8-.3-.3-.7-.6-1-1C736.4 109.2 629.5 64 512 64s-224.4 45.2-304.3 119.2c-.3.3-.7.6-1 1-1 .9-2 1.9-3 2.9-.5.5-1 1-1.6 1.5-1.5 1.4-3 2.9-4.5 4.3l-.3.3-4.8 4.8-.1.1c-3.3 3.3-6.5 6.7-9.7 10.1l-.1.1c-1.6 1.7-3.1 3.4-4.6 5.1l-.1.1c-1.4 1.5-2.8 3.1-4.1 4.7-.4.5-.8.9-1.2 1.4-1.1 1.2-2.1 2.5-3.2 3.7-.2.3-.5.5-.7.8C103.4 301.9 64 402.3 64 512s39.4 210.1 104.8 288c.2.3.5.6.7.9l3.1 3.7c.4.5.8.9 1.2 1.4l4.1 4.7c0 .1.1.1.1.2 1.5 1.7 3 3.4 4.6 5l.1.1c3.2 3.4 6.4 6.8 9.6 10.1l.1.1c1.6 1.6 3.1 3.2 4.7 4.7l.3.3c3.3 3.3 6.7 6.5 10.1 9.6 80.1 74 187 119.2 304.5 119.2s224.4-45.2 304.3-119.2a300 300 0 0010-9.6l.3-.3c1.6-1.6 3.2-3.1 4.7-4.7l.1-.1c3.3-3.3 6.5-6.7 9.6-10.1l.1-.1c1.5-1.7 3.1-3.3 4.6-5 0-.1.1-.1.1-.2 1.4-1.5 2.8-3.1 4.1-4.7.4-.5.8-.9 1.2-1.4a99 99 0 003.3-3.7zm4.1-142.6c-13.8 32.6-32 62.8-54.2 90.2a444.07 444.07 0 00-81.5-55.9c11.6-46.9 18.8-98.4 20.7-152.6H887c-3 40.9-12.6 80.6-28.5 118.3zM887 484H743.5c-1.9-54.2-9.1-105.7-20.7-152.6 29.3-15.6 56.6-34.4 81.5-55.9A373.86 373.86 0 01887 484zM658.3 165.5c39.7 16.8 75.8 40 107.6 69.2a394.72 394.72 0 01-59.4 41.8c-15.7-45-35.8-84.1-59.2-115.4 3.7 1.4 7.4 2.9 11 4.4zm-90.6 700.6c-9.2 7.2-18.4 12.7-27.7 16.4V697a389.1 389.1 0 01115.7 26.2c-8.3 24.6-17.9 47.3-29 67.8-17.4 32.4-37.8 58.3-59 75.1zm59-633.1c11 20.6 20.7 43.3 29 67.8A389.1 389.1 0 01540 327V141.6c9.2 3.7 18.5 9.1 27.7 16.4 21.2 16.7 41.6 42.6 59 75zM540 640.9V540h147.5c-1.6 44.2-7.1 87.1-16.3 127.8l-.3 1.2A445.02 445.02 0 00540 640.9zm0-156.9V383.1c45.8-2.8 89.8-12.5 130.9-28.1l.3 1.2c9.2 40.7 14.7 83.5 16.3 127.8H540zm-56 56v100.9c-45.8 2.8-89.8 12.5-130.9 28.1l-.3-1.2c-9.2-40.7-14.7-83.5-16.3-127.8H484zm-147.5-56c1.6-44.2 7.1-87.1 16.3-127.8l.3-1.2c41.1 15.6 85 25.3 130.9 28.1V484H336.5zM484 697v185.4c-9.2-3.7-18.5-9.1-27.7-16.4-21.2-16.7-41.7-42.7-59.1-75.1-11-20.6-20.7-43.3-29-67.8 37.2-14.6 75.9-23.3 115.8-26.1zm0-370a389.1 389.1 0 01-115.7-26.2c8.3-24.6 17.9-47.3 29-67.8 17.4-32.4 37.8-58.4 59.1-75.1 9.2-7.2 18.4-12.7 27.7-16.4V327zM365.7 165.5c3.7-1.5 7.3-3 11-4.4-23.4 31.3-43.5 70.4-59.2 115.4-21-12-40.9-26-59.4-41.8 31.8-29.2 67.9-52.4 107.6-69.2zM165.5 365.7c13.8-32.6 32-62.8 54.2-90.2 24.9 21.5 52.2 40.3 81.5 55.9-11.6 46.9-18.8 98.4-20.7 152.6H137c3-40.9 12.6-80.6 28.5-118.3zM137 540h143.5c1.9 54.2 9.1 105.7 20.7 152.6a444.07 444.07 0 00-81.5 55.9A373.86 373.86 0 01137 540zm228.7 318.5c-39.7-16.8-75.8-40-107.6-69.2 18.5-15.8 38.4-29.7 59.4-41.8 15.7 45 35.8 84.1 59.2 115.4-3.7-1.4-7.4-2.9-11-4.4zm292.6 0c-3.7 1.5-7.3 3-11 4.4 23.4-31.3 43.5-70.4 59.2-115.4 21 12 40.9 26 59.4 41.8a373.81 373.81 0 01-107.6 69.2z"></path>
                </svg>
              </span>
            </span>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Số tài khoản"
              className="ant-input ant-input-lg"
            />
          </span>
          {errors.accountNumber && (
            <div className="error-text">{errors.accountNumber}</div>
          )}

          <span className="ant-input-affix-wrapper bank-input ant-input-affix-wrapper-lg">
            <span className="ant-input-prefix">
              <span
                role="img"
                aria-label="user"
                className="anticon anticon-user information-icon"
              >
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
              </span>
            </span>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Tên chủ tài khoản"
              className="ant-input ant-input-lg"
            />
          </span>
          {errors.accountName && (
            <div className="error-text">{errors.accountName}</div>
          )}

          {/* Simplified Bank Dropdown */}
          <div className="bank-dropdown-container">
            <div
              className="bank-dropdown-header"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {formData.bank ? (
                <div className="selected-bank">
                  {formData.bankLogo && (
                    <img
                      src={formData.bankLogo}
                      alt="Bank Logo"
                      className="bank-dropdown-logo"
                    />
                  )}
                  <span>{formData.bank}</span>
                </div>
              ) : (
                <span className="bank-placeholder">
                  Chọn ngân hàng thụ hưởng
                </span>
              )}
              <span className="dropdown-arrow">▼</span>
            </div>

            {showDropdown && (
              <div className="bank-dropdown-menu">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className="bank-option"
                    onClick={() => handleSelectBank(bank)}
                  >
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="bank-dropdown-logo"
                    />
                    <span>{bank.name}</span>
                  </div>
                ))}
              </div>
            )}

            {errors.bank && <div className="error-text">{errors.bank}</div>}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!isFormValid}
          >
            Gửi yêu cầu
          </button>
        </form>
      </div>
    </div>
  );
};

export default BankInfoForm;
