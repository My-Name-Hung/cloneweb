import React, { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import "../styles/Settings.css";
import { settingsApi } from "../utils/apiService";

const Settings = () => {
  const [settings, setSettings] = useState({
    interestRate: "1%",
    maxLoanAmount: "500000000",
    maxLoanTerm: "36",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { refreshSession, admin } = useAdmin();

  // Handle authentication errors with debounce
  useEffect(() => {
    let debounceTimer;
    const handleAuthError = (event) => {
      if (event.detail?.url?.includes("/admin/settings")) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (retryCount < 3) {
            setRetryCount((prev) => prev + 1);
          } else {
            setError("Không thể tải cài đặt. Vui lòng thử lại sau.");
            setLoading(false);
          }
        }, 1000);
      }
    };

    window.addEventListener("adminAuthError", handleAuthError);
    return () => {
      window.removeEventListener("adminAuthError", handleAuthError);
      clearTimeout(debounceTimer);
    };
  }, [retryCount]);

  // Fetch settings function
  const fetchSettings = useCallback(async () => {
    if (isFetching) return;

    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);

      // Ensure token is fresh before making the request
      if (admin?.token) {
        await refreshSession();
      }

      const response = await settingsApi.getSettings();

      if (response.success) {
        setSettings(response.settings);
        setIsDataFetched(true);
      } else {
        setError(response.message || "Không thể tải cài đặt");
      }
    } catch (error) {
      console.error("Settings fetch error:", error);
      setError(error.response?.data?.message || "Lỗi khi tải cài đặt");

      // Only retry on network errors and if we haven't exceeded max retries
      if (error.message?.includes("Network Error") && retryCount < 3) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [refreshSession, retryCount, isFetching, admin]);

  // Initial data fetch
  useEffect(() => {
    if (!isDataFetched && !isFetching) {
      fetchSettings();
    }
  }, [retryCount, isDataFetched, fetchSettings, isFetching]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage("");

      // Ensure token is fresh before updating settings
      if (admin?.token) {
        await refreshSession();
      }

      const response = await settingsApi.updateSettings(settings);

      if (response.success) {
        setSuccessMessage("Cập nhật cài đặt thành công");
        alert("Cài đặt đã được lưu thành công!");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(response.message || "Không thể cập nhật cài đặt");
        alert("Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Settings update error:", error);
      setError(error.response?.data?.message || "Lỗi khi cập nhật cài đặt");
      alert("Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isDataFetched) {
    return (
      <div className="admin-content-container">
        <div className="admin-content-header">
          <h1>Cài đặt hệ thống</h1>
        </div>
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-container">
      <div className="admin-content-header">
        <h1>Cài đặt hệ thống</h1>
      </div>

      {error && (
        <div className="admin-error-message">
          <p>{error}</p>
          <button
            className="admin-button"
            onClick={() => {
              if (!loading) {
                setIsDataFetched(false);
                setRetryCount(0);
                fetchSettings();
              }
            }}
            disabled={loading}
          >
            {loading ? "Đang tải lại..." : "Thử lại"}
          </button>
        </div>
      )}

      {successMessage && (
        <div className="admin-success-message">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="interestRate">Lãi suất mặc định</label>
          <input
            type="text"
            id="interestRate"
            name="interestRate"
            value={settings.interestRate}
            onChange={handleInputChange}
            required
          />
          <small>Ví dụ: 1% (lãi suất hàng tháng)</small>
        </div>

        <div className="form-group">
          <label htmlFor="maxLoanAmount">Số tiền vay tối đa</label>
          <input
            type="text"
            id="maxLoanAmount"
            name="maxLoanAmount"
            value={settings.maxLoanAmount}
            onChange={handleInputChange}
            required
          />
          <small>Nhập số tiền không có định dạng</small>
        </div>

        <div className="form-group">
          <label htmlFor="maxLoanTerm">Kỳ hạn vay tối đa (tháng)</label>
          <input
            type="number"
            id="maxLoanTerm"
            name="maxLoanTerm"
            value={settings.maxLoanTerm}
            onChange={handleInputChange}
            required
            min="1"
          />
        </div>

        <button type="submit" className="admin-button" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
