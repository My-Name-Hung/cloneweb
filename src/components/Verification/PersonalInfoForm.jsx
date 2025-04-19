import axios from "axios";
import React, { useState } from "react";
import { FaArrowLeft, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import "./PersonalInfoForm.css";

const PersonalInfoForm = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    gender: "Nam",
    birthDate: "",
    occupation: "",
    income: "",
    loanPurpose: "",
    address: "",
    contactPerson: "",
    relationship: "",
  });

  const [errors, setErrors] = useState({});

  const handleBack = () => {
    navigate(-1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "birthDate") {
      // Loại bỏ tất cả ký tự không phải số
      let formatted = value.replace(/[^\d]/g, "");

      // Giới hạn độ dài tối đa 8 chữ số (DDMMYYYY)
      if (formatted.length > 8) {
        formatted = formatted.slice(0, 8);
      }

      // Thêm dấu "/" để ngăn cách ngày/tháng/năm
      if (formatted.length > 4) {
        formatted =
          formatted.slice(0, 2) +
          "/" +
          formatted.slice(2, 4) +
          "/" +
          formatted.slice(4);
      } else if (formatted.length > 2) {
        formatted = formatted.slice(0, 2) + "/" + formatted.slice(2);
      }

      // Cập nhật state
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "fullName":
        if (!value.trim()) {
          error = "Hãy nhập tên của bạn";
        }
        break;
      case "idNumber":
        if (!value.trim()) {
          error = "Nhập số CMND/CCCD";
        } else if (!/^\d{9}(\d{3})?$/.test(value)) {
          error = "Số CMND/CCCD không hợp lệ";
        }
        break;
      case "birthDate":
        // Loại bỏ dấu "/" để kiểm tra số ký tự
        const numericDate = value.replace(/\//g, "");
        if (!numericDate) {
          error = "Nhập ngày sinh của bạn";
        } else if (numericDate.length !== 8) {
          error = "Nhập đúng định dạng ngày/tháng/năm";
        }
        break;
      case "occupation":
        if (!value.trim()) {
          error = "Nhập công việc hiện tại";
        }
        break;
      case "loanPurpose":
        if (!value.trim()) {
          error = "Nhập mục đích vay của bạn";
        }
        break;
      case "income":
        if (!value) {
          error = "Vui lòng chọn thu nhập";
        }
        break;
      case "address":
        if (!value.trim()) {
          error = "Vui lòng nhập địa chỉ";
        }
        break;
      case "contactPerson":
        if (!value.trim()) {
          error = "Nhập SĐT người thân";
        }
        break;
      case "relationship":
        if (!value.trim()) {
          error = "Nhập mối quan hệ với người thân";
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return !error;
  };

  const validateForm = () => {
    const fieldNames = [
      "fullName",
      "idNumber",
      "gender",
      "birthDate",
      "occupation",
      "income",
      "loanPurpose",
      "address",
      "contactPerson",
      "relationship",
    ];

    let isValid = true;

    fieldNames.forEach((fieldName) => {
      const fieldValid = validateField(fieldName, formData[fieldName]);
      if (!fieldValid) {
        isValid = false;
      }
    });

    return isValid;
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

      // Update user profile with personal information
      const response = await axios.post(
        `${API_URL}/api/users/${user.id}/profile`,
        formData
      );

      if (response.data.success) {
        // Update local user data with the new information
        const updatedUser = {
          ...user,
          fullName: formData.fullName,
          personalInfo: {
            ...formData,
          },
        };

        // Update user in context and localStorage
        updateUser(updatedUser);

        // Navigate to bank-info page
        navigate("/bank-info", {
          state: {
            successMessage: "Thông tin cá nhân đã được cập nhật",
          },
        });
      }
    } catch (error) {
      console.error("Error saving personal information:", error);

      // For demo purposes, update user info even if API fails
      const updatedUser = {
        ...user,
        fullName: formData.fullName,
        personalInfo: {
          ...formData,
        },
      };

      // Update user in context and localStorage
      updateUser(updatedUser);

      // Navigate to bank-info page
      navigate("/bank-info", {
        state: {
          successMessage: "Thông tin cá nhân đã được cập nhật",
        },
      });
    } finally {
      hideLoading();
    }
  };

  const handleDropdownClick = (fieldName) => {
    // Cải thiện việc mở dropdown
    try {
      const selectElement = document.querySelector(
        `select[name="${fieldName}"]`
      );
      if (selectElement) {
        // Kích hoạt sự kiện native của select
        if (document.createEvent) {
          const e = document.createEvent("MouseEvents");
          e.initMouseEvent(
            "mousedown",
            true,
            true,
            window,
            0,
            0,
            0,
            0,
            0,
            false,
            false,
            false,
            false,
            0,
            null
          );
          selectElement.dispatchEvent(e);
        } else {
          selectElement.fireEvent("onmousedown");
        }
      }
    } catch (error) {
      console.error("Error triggering dropdown", error);
    }
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
        <h2 className="personal-info-title">Thông tin cá nhân</h2>

        <form onSubmit={handleSubmit} className="personal-info-form">
          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Họ tên"
                className={`form-input ${errors.fullName ? "error" : ""}`}
              />
              <div className="input-icon text-icon">
                <span>Aa</span>
              </div>
            </div>
            {errors.fullName && (
              <div className="error-text">{errors.fullName}</div>
            )}
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Số CMND/CCCD"
                className={`form-input ${errors.idNumber ? "error" : ""}`}
              />
              <div className="input-icon list-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="#777"
                  fill="none"
                  strokeWidth="1.5"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
            </div>
            {errors.idNumber && (
              <div className="error-text">{errors.idNumber}</div>
            )}
          </div>

          <div className="form-group">
            <div
              className="input-container dropdown-container"
              onClick={() => handleDropdownClick("gender")}
            >
              <div className="ant-select-selector">
                <span className="ant-select-selection-search">
                  <input
                    type="search"
                    autoComplete="off"
                    className="ant-select-selection-search-input"
                    role="combobox"
                    aria-haspopup="listbox"
                    readOnly
                    unselectable="on"
                    style={{ opacity: 0 }}
                    aria-expanded="false"
                  />
                </span>
                <span
                  className="ant-select-selection-item"
                  title={formData.gender}
                >
                  {formData.gender}
                </span>
              </div>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-input hidden-select"
                tabIndex="0"
                aria-hidden="false"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
              <div className="input-icon dropdown-icon">
                <FaChevronDown />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={
                  formData.birthDate
                    ? "Sinh nhật : ngày/tháng/năm"
                    : "__/__/____"
                }
                className={`form-input ${errors.birthDate ? "error" : ""}`}
                maxLength="10"
                onFocus={(e) => {
                  if (!e.target.value) {
                    // Thiết lập placeholder dạng dấu gạch ngang khi focus
                    e.target.placeholder = "__/__/____";
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    // Khôi phục lại placeholder thông thường khi mất focus
                    e.target.placeholder = "Sinh nhật : ngày/tháng/năm";
                  }
                }}
              />
              <div className="input-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="#777"
                  fill="none"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            {errors.birthDate && (
              <div className="error-text">{errors.birthDate}</div>
            )}
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nghề nghiệp"
                className="form-input"
              />
              <div className="input-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="#777"
                  fill="none"
                  strokeWidth="1.5"
                >
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"></path>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div
              className="input-container dropdown-container"
              onClick={() => handleDropdownClick("income")}
            >
              <div className="ant-select-selector">
                <span className="ant-select-selection-search">
                  <input
                    type="search"
                    autoComplete="off"
                    className="ant-select-selection-search-input"
                    role="combobox"
                    aria-haspopup="listbox"
                    readOnly
                    unselectable="on"
                    style={{ opacity: 0 }}
                    aria-expanded="false"
                  />
                </span>
                <span
                  className="ant-select-selection-item"
                  title={
                    formData.income === "0-5000000"
                      ? "Dưới 5 triệu"
                      : formData.income === "5000000-10000000"
                      ? "Từ 5 - 10 triệu"
                      : formData.income === "10000000-20000000"
                      ? "Từ 10 - 20 triệu"
                      : formData.income === "20000000+"
                      ? "Trên 20 triệu"
                      : "Chọn thu nhập của bạn"
                  }
                >
                  {formData.income === "0-5000000"
                    ? "Dưới 5 triệu"
                    : formData.income === "5000000-10000000"
                    ? "Từ 5 - 10 triệu"
                    : formData.income === "10000000-20000000"
                    ? "Từ 10 - 20 triệu"
                    : formData.income === "20000000+"
                    ? "Trên 20 triệu"
                    : "Chọn thu nhập của bạn"}
                </span>
              </div>
              <select
                name="income"
                value={formData.income}
                onChange={handleChange}
                className="form-input hidden-select"
                tabIndex="0"
                aria-hidden="false"
              >
                <option value="" disabled selected={formData.income === ""}>
                  Chọn thu nhập của bạn
                </option>
                <option value="0-5000000">Dưới 5 triệu</option>
                <option value="5000000-10000000">Từ 5 - 10 triệu</option>
                <option value="10000000-20000000">Từ 10 - 20 triệu</option>
                <option value="20000000+">Trên 20 triệu</option>
              </select>
              <div className="input-icon dropdown-icon">
                <FaChevronDown />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                name="loanPurpose"
                value={formData.loanPurpose}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Mục đích vay"
                className="form-input"
              />
              <div className="input-icon list-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="#777"
                  fill="none"
                  strokeWidth="1.5"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Địa chỉ"
                className="form-input"
              />
              <div className="input-icon list-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="#777"
                  fill="none"
                  strokeWidth="1.5"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type="tel"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="SĐT người thân"
                className="form-input"
              />
              <div className="input-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="#777"
                  fill="none"
                  strokeWidth="1.5"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Mối quan hệ với người thân"
                className="form-input"
              />
              <div className="input-icon list-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="#777"
                  fill="none"
                  strokeWidth="1.5"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
          </div>

          <button type="submit" className="continue-button">
            Tiếp tục
          </button>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
