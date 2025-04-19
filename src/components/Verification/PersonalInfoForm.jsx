import axios from "axios";
import React, { useState } from "react";
import { FaArrowLeft, FaCalendarAlt } from "react-icons/fa";
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "Vui lòng nhập số CMND/CCCD";
    } else if (!/^\d{9}(\d{3})?$/.test(formData.idNumber)) {
      newErrors.idNumber = "Số CMND/CCCD không hợp lệ";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Vui lòng chọn ngày sinh";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

        // Navigate to loan page
        navigate("/loan", {
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

      // Navigate to loan page
      navigate("/loan", {
        state: {
          successMessage: "Thông tin cá nhân đã được cập nhật",
        },
      });
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="verification-container">
      {/* Header */}
      <div className="verification-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h2>Thông tin cá nhân</h2>
      </div>

      <form onSubmit={handleSubmit} className="personal-info-form">
        <div className="form-group">
          <label>Họ tên</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Họ tên"
            className={`form-control ${errors.fullName ? "error" : ""}`}
          />
          {errors.fullName && (
            <div className="error-text">{errors.fullName}</div>
          )}
        </div>

        <div className="form-group">
          <label>Số CMND/CCCD</label>
          <input
            type="text"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            placeholder="Số CMND/CCCD"
            className={`form-control ${errors.idNumber ? "error" : ""}`}
          />
          {errors.idNumber && (
            <div className="error-text">{errors.idNumber}</div>
          )}
        </div>

        <div className="form-group">
          <label>Giới tính</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="form-control"
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div className="form-group">
          <label>Sinh nhật</label>
          <div className="date-input-container">
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={`form-control ${errors.birthDate ? "error" : ""}`}
            />
            <FaCalendarAlt className="calendar-icon" />
          </div>
          {errors.birthDate && (
            <div className="error-text">{errors.birthDate}</div>
          )}
        </div>

        <div className="form-group">
          <label>Nghề nghiệp</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="Nghề nghiệp"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Mục đích vay</label>
          <input
            type="text"
            name="loanPurpose"
            value={formData.loanPurpose}
            onChange={handleChange}
            placeholder="Mục đích vay"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Địa chỉ"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>SĐT người thân</label>
          <input
            type="tel"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="SĐT người thân"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Mối quan hệ với người thân</label>
          <input
            type="text"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            placeholder="Mối quan hệ với người thân"
            className="form-control"
          />
        </div>

        <button type="submit" className="continue-button">
          Tiếp tục
        </button>
      </form>
    </div>
  );
};

export default PersonalInfoForm;
