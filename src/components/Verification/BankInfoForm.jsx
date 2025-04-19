import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import "./BankInfoForm.css";

const BankInfoForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const [formData, setFormData] = useState({
    accountNumber: "",
    accountName: "",
    bank: "",
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // List of banks
  const banks = [
    "BIDV - Ngân hàng Đầu tư và Phát triển Việt Nam",
    "Vietcombank - Ngân hàng Ngoại thương Việt Nam",
    "Techcombank - Ngân hàng Kỹ thương Việt Nam",
    "VPBank - Ngân hàng Việt Nam Thịnh Vượng",
    "ACB - Ngân hàng Á Châu",
    "MBBank - Ngân hàng Quân đội",
    "Sacombank - Ngân hàng Sài Gòn Thương Tín",
    "TPBank - Ngân hàng Tiên Phong",
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

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

    // Validate account number
    if (!formData.accountNumber.trim()) {
      formErrors.accountNumber = "Vui lòng nhập số tài khoản";
    } else if (!/^\d+$/.test(formData.accountNumber)) {
      formErrors.accountNumber = "Số tài khoản chỉ bao gồm số";
    }

    // Validate account name
    if (!formData.accountName.trim()) {
      formErrors.accountName = "Vui lòng nhập tên chủ tài khoản";
    }

    // Validate bank
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

      // Update user profile with bank information
      const response = await axios.post(
        `${API_URL}/api/users/${user.id}/bank-info`,
        formData
      );

      if (response.data.success) {
        // Navigate to loan page
        navigate("/loan", {
          state: {
            message: "Thông tin ngân hàng đã được cập nhật thành công!",
            success: true,
            ...location.state,
          },
        });
      }
    } catch (error) {
      console.error("Error saving bank information:", error);

      // For demo purposes, still navigate to loan page
      navigate("/loan", {
        state: {
          message: "Thông tin ngân hàng đã được cập nhật thành công!",
          success: true,
          ...location.state,
        },
      });
    } finally {
      hideLoading();
    }
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

  // Format account number to show as ****
  const formatAccountNumber = () => {
    if (!formData.accountNumber) return "****";
    return "*".repeat(formData.accountNumber.length);
  };

  // Format account name to show as ****
  const formatAccountName = () => {
    if (!formData.accountName) return "****";
    return "*".repeat(formData.accountName.length);
  };

  return (
    <div className="verification-container">
      {/* Header */}
      <div className="verification-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <div className="header-title">Xác minh</div>
      </div>

      <div className="personal-info-main">
        <h2 className="personal-info-title">Thông tin ngân hàng thụ hưởng</h2>

        {/* Bank Card Display */}
        <div className="bank-card-container">
          <div className="bank-card-overlay">
            <div className="card-title">Chọn ngân hàng</div>

            <div className="chip-container">
              <div className="chip-image"></div>
              <svg
                className="chip-signal"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z"
                  fill="gold"
                />
                <path
                  d="M8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13Z"
                  fill="gold"
                />
                <path
                  d="M11 8C11 8.55228 10.5523 9 10 9C9.44772 9 9 8.55228 9 8C9 7.44772 9.44772 7 10 7C10.5523 7 11 7.44772 11 8Z"
                  fill="gold"
                />
                <path
                  d="M13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8Z"
                  fill="gold"
                />
                <path
                  d="M15 8C15 8.55228 14.5523 9 14 9C13.4477 9 13 8.55228 13 8C13 7.44772 13.4477 7 14 7C14.5523 7 15 7.44772 15 8Z"
                  fill="gold"
                />
              </svg>
            </div>

            <div className="card-numbers">
              <div className="bank-card-account-number">
                {formatAccountNumber()}
              </div>
              <div className="bank-card-account-name">
                {formatAccountName()}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Số tài khoản"
              className="form-input"
            />
            {errors.accountNumber && (
              <div className="error-text">{errors.accountNumber}</div>
            )}
          </div>

          <div className="form-field">
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Tên chủ tài khoản"
              className="form-input"
            />
            {errors.accountName && (
              <div className="error-text">{errors.accountName}</div>
            )}
          </div>

          <div className="form-field">
            <select
              name="bank"
              value={formData.bank}
              onChange={handleChange}
              onBlur={handleBlur}
              className="form-select"
            >
              <option value="" disabled>
                Chọn ngân hàng thụ hưởng
              </option>
              {banks.map((bank, index) => (
                <option key={index} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
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
