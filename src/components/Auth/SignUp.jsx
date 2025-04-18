import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MBLogo from "../../assets/logo/mblogo.png";
import "./AuthStyles.css";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [error, setError] = useState("");
  const [termsError, setTermsError] = useState(false);
  const [successNotification, setSuccessNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingLogo, setShowLoadingLogo] = useState(false);

  // Auto-hide terms error after 5 seconds
  useEffect(() => {
    let timer;
    if (termsError) {
      timer = setTimeout(() => {
        setTermsError(false);
      }, 5000);
    }

    // Clean up timer on unmount or when termsError changes
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [termsError]);

  // Auto-hide success notification after 5 seconds and redirect to home
  useEffect(() => {
    let timer;
    if (successNotification) {
      timer = setTimeout(() => {
        setSuccessNotification(false);
        // Store user info in sessionStorage to simulate login
        sessionStorage.setItem(
          "user",
          JSON.stringify({ phone: formData.phone, id: Date.now() })
        );
        // Navigate to home page
        navigate("/");
      }, 5000);
    }

    // Clean up timer on unmount or when successNotification changes
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [successNotification, navigate, formData.phone]);

  // Show and hide loading logo
  useEffect(() => {
    if (loading) {
      setShowLoadingLogo(true);
    } else {
      // Add a small delay before hiding to ensure animations complete
      const timer = setTimeout(() => {
        setShowLoadingLogo(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear terms error when checkbox is checked
    if (name === "agreeToTerms" && checked) {
      setTermsError(false);
    }
  };

  const validateForm = () => {
    // Reset errors
    setError("");
    setTermsError(false);

    if (!formData.phone || !formData.password || !formData.confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Số điện thoại không hợp lệ");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }

    if (!formData.agreeToTerms) {
      setTermsError(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTermsError(false);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      // Show success notification
      setSuccessNotification(true);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {termsError && (
        <div className="custom-error">
          <div className="error-icon">✕</div>
          <div className="error-text">
            Bạn phải đồng ý với điều khoản và dịch vụ để đăng ký
          </div>
        </div>
      )}

      {successNotification && (
        <div className="custom-success">
          <div className="success-icon">✓</div>
          <div className="success-text">Tạo tài khoản thành công.</div>
        </div>
      )}

      {showLoadingLogo && (
        <div className="loading-container">
          <img src={MBLogo} alt="Loading" className="loading-logo" />
        </div>
      )}

      <div className="logo-container">
        <img src={MBLogo} alt="MB Bank Logo" />
      </div>

      <h1 className="auth-title">Đăng ký tài khoản</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="tel"
          name="phone"
          placeholder="Nhập số điện thoại"
          className="form-input"
          value={formData.phone}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          className="form-input"
          value={formData.password}
          onChange={handleChange}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Nhập lại mật khẩu"
          className="form-input"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <div className="form-checkbox">
          <input
            type="checkbox"
            name="agreeToTerms"
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
          />
          <label htmlFor="agreeToTerms">
            Đồng ý với{" "}
            <a href="/terms" className="terms-link">
              điều khoản dịch vụ
            </a>
          </label>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>

        {error && <p className="error-message">{error}</p>}
      </form>

      <div className="password-hint">
        <p>Độ dài mật khẩu từ 6 - 20 ký tự</p>
        <p style={{ fontWeight: "600" }}>Ví dụ: </p>
        <p>Mật khẩu: 123456</p>
      </div>

      <div className="auth-footer">
        <p>
          Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
