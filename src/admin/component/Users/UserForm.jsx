import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/UserForm.css";

const UserForm = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!userId;

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    fullName: "",
    hasVerifiedDocuments: false,
    personalInfo: {
      idNumber: "",
      gender: "Nam",
      birthDate: "",
      occupation: "",
      income: "",
      loanPurpose: "",
      address: "",
      contactPerson: "",
      relationship: "",
    },
    bankInfo: {
      accountNumber: "",
      accountName: "",
      bank: "",
    },
  });

  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);

        const response = await axios.get(
          `${API_URL}/api/admin/users/${userId}`
        );

        if (response.data.success) {
          const userData = response.data.user;

          setFormData({
            phone: userData.phone || "",
            password: "", // Don't populate password for security
            fullName: userData.fullName || "",
            hasVerifiedDocuments: userData.hasVerifiedDocuments || false,
            personalInfo: {
              idNumber: userData.personalInfo?.idNumber || "",
              gender: userData.personalInfo?.gender || "Nam",
              birthDate: userData.personalInfo?.birthDate || "",
              occupation: userData.personalInfo?.occupation || "",
              income: userData.personalInfo?.income || "",
              loanPurpose: userData.personalInfo?.loanPurpose || "",
              address: userData.personalInfo?.address || "",
              contactPerson: userData.personalInfo?.contactPerson || "",
              relationship: userData.personalInfo?.relationship || "",
            },
            bankInfo: {
              accountNumber: userData.bankInfo?.accountNumber || "",
              accountName: userData.bankInfo?.accountName || "",
              bank: userData.bankInfo?.bank || "",
            },
          });
        } else {
          setError(response.data.message || "Failed to fetch user data");
        }
      } catch (error) {
        console.error("User data fetch error:", error);
        setError(error.response?.data?.message || "Error fetching user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [API_URL, userId, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      let response;

      if (isEditMode) {
        // Only send necessary fields for edit
        const updateData = { ...formData };

        // Don't send empty password on update
        if (!updateData.password) {
          delete updateData.password;
        }

        response = await axios.put(
          `${API_URL}/api/admin/users/${userId}`,
          updateData
        );
      } else {
        // For new user, phone and password are required
        if (!formData.phone || !formData.password) {
          setError("Phone and password are required");
          setLoading(false);
          return;
        }

        response = await axios.post(`${API_URL}/api/admin/users`, formData);
      }

      if (response.data.success) {
        setSuccessMessage(
          isEditMode ? "User updated successfully" : "User created successfully"
        );

        // Redirect after a short delay
        setTimeout(() => {
          navigate(isEditMode ? `/admin/users/${userId}` : "/admin/users");
        }, 2000);
      } else {
        setError(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setError(error.response?.data?.message || "Error processing request");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="user-form-container">
      <div className="admin-page-header">
        <h1>{isEditMode ? "Edit User" : "Create New User"}</h1>
        <button
          className="action-button"
          onClick={() =>
            navigate(isEditMode ? `/admin/users/${userId}` : "/admin/users")
          }
        >
          Cancel
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {isEditMode
                ? "Password (leave empty to keep current)"
                : "Password"}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditMode}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="hasVerifiedDocuments"
                checked={formData.hasVerifiedDocuments}
                onChange={handleChange}
              />
              User has verified documents
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Personal Information</h2>

          <div className="form-group">
            <label htmlFor="personalInfo.idNumber">ID Number</label>
            <input
              type="text"
              id="personalInfo.idNumber"
              name="personalInfo.idNumber"
              value={formData.personalInfo.idNumber}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.gender">Gender</label>
            <select
              id="personalInfo.gender"
              name="personalInfo.gender"
              value={formData.personalInfo.gender}
              onChange={handleChange}
              className="form-control"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.birthDate">Birth Date</label>
            <input
              type="text"
              id="personalInfo.birthDate"
              name="personalInfo.birthDate"
              value={formData.personalInfo.birthDate}
              onChange={handleChange}
              placeholder="DD/MM/YYYY"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.occupation">Occupation</label>
            <input
              type="text"
              id="personalInfo.occupation"
              name="personalInfo.occupation"
              value={formData.personalInfo.occupation}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.income">Income</label>
            <select
              id="personalInfo.income"
              name="personalInfo.income"
              value={formData.personalInfo.income}
              onChange={handleChange}
              className="form-control"
            >
              <option value="">Select Income</option>
              <option value="0-5000000">Below 5 million</option>
              <option value="5000000-10000000">5 - 10 million</option>
              <option value="10000000-20000000">10 - 20 million</option>
              <option value="20000000+">Above 20 million</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.loanPurpose">Loan Purpose</label>
            <input
              type="text"
              id="personalInfo.loanPurpose"
              name="personalInfo.loanPurpose"
              value={formData.personalInfo.loanPurpose}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.address">Address</label>
            <textarea
              id="personalInfo.address"
              name="personalInfo.address"
              value={formData.personalInfo.address}
              onChange={handleChange}
              className="form-control"
              rows="3"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.contactPerson">Contact Person</label>
            <input
              type="text"
              id="personalInfo.contactPerson"
              name="personalInfo.contactPerson"
              value={formData.personalInfo.contactPerson}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="personalInfo.relationship">Relationship</label>
            <input
              type="text"
              id="personalInfo.relationship"
              name="personalInfo.relationship"
              value={formData.personalInfo.relationship}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Bank Information</h2>

          <div className="form-group">
            <label htmlFor="bankInfo.accountNumber">Account Number</label>
            <input
              type="text"
              id="bankInfo.accountNumber"
              name="bankInfo.accountNumber"
              value={formData.bankInfo.accountNumber}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bankInfo.accountName">Account Name</label>
            <input
              type="text"
              id="bankInfo.accountName"
              name="bankInfo.accountName"
              value={formData.bankInfo.accountName}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bankInfo.bank">Bank</label>
            <input
              type="text"
              id="bankInfo.bank"
              name="bankInfo.bank"
              value={formData.bankInfo.bank}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() =>
              navigate(isEditMode ? `/admin/users/${userId}` : "/admin/users")
            }
          >
            Cancel
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading
              ? "Processing..."
              : isEditMode
              ? "Update User"
              : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
