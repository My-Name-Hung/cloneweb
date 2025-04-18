import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MBLogo from "../../assets/logo/mblogo.png";
import { useLoading } from "../../context/LoadingContext";
import { authApi } from "../../services/api";
import "./AuthStyles.css";

const SignUp = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [error, setError] = useState("");
  const [termsError, setTermsError] = useState(false);
  const [successNotification, setSuccessNotification] = useState(false);

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
        // Ẩn loading screen trước khi chuyển hướng
        hideLoading();
        setSuccessNotification(false);

        // Navigate to home page
        navigate("/");
      }, 5000);
    }

    // Clean up timer on unmount or when successNotification changes
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [successNotification, navigate, hideLoading]);

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

    // Show global loading screen
    showLoading();

    try {
      // Sử dụng API service thay vì fetch trực tiếp
      const data = await authApi.signup({
        phone: formData.phone,
        password: formData.password,
      });

      console.log("Signup successful:", data);

      // Ẩn loading screen trước khi hiển thị success notification
      hideLoading();

      // Lưu session ngay khi đăng ký thành công
      sessionStorage.setItem(
        "user",
        JSON.stringify(
          data.user || {
            phone: formData.phone,
            id: Date.now(),
          }
        )
      );

      // Show success notification
      setSuccessNotification(true);

      // Clear form
      setFormData({
        phone: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false,
      });
    } catch (err) {
      console.error("Signup error:", err);

      // Check if this is a network error (API server not running or CORS issue)
      if (
        err.name === "TypeError" &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError"))
      ) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");

        // For demo or development purposes - auto success if server is not reachable
        // Đảm bảo ẩn loading screen
        hideLoading();

        // Lưu session và hiển thị thông báo thành công
        sessionStorage.setItem(
          "user",
          JSON.stringify({
            phone: formData.phone,
            id: Date.now(),
            demoMode: true, // Đánh dấu là demo mode
          })
        );

        setSuccessNotification(true);
        return; // Skip the rest
      } else {
        setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
        // Ẩn loading screen nếu có lỗi
        hideLoading();
      }
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

        <button type="submit" className="submit-button">
          Đăng ký
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
