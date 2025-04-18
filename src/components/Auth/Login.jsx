import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MBLogo from "../../assets/logo/mblogo.png";
import { useLoading } from "../../context/LoadingContext";
import { authApi } from "../../services/api";
import "./AuthStyles.css";

const Login = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [successNotification, setSuccessNotification] = useState(false);

  // Auto-hide success notification after 3 seconds and redirect to home
  useEffect(() => {
    let timer;
    if (successNotification) {
      timer = setTimeout(() => {
        // Ẩn loading screen trước khi chuyển hướng
        hideLoading();
        setSuccessNotification(false);

        // Navigate to home page
        navigate("/");
      }, 3000);
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
  };

  const validateForm = () => {
    // Reset errors
    setError("");

    if (!formData.phone || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Số điện thoại không hợp lệ");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    // Show global loading screen
    showLoading();

    try {
      // Sử dụng API service
      const data = await authApi.login({
        phone: formData.phone,
        password: formData.password,
      });

      console.log("Login successful:", data);

      // Ẩn loading screen trước khi hiển thị success notification
      hideLoading();

      // Save user data in session storage (use the data from the server)
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
    } catch (err) {
      // Handle network errors or server errors
      console.error("Login error:", err);

      // Check if this is a network error (API server not running or CORS issue)
      if (
        err.name === "TypeError" &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError"))
      ) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");

        // For demo or development purposes - auto login if server is not reachable
        if (formData.phone.length === 10 && formData.password.length >= 6) {
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
        }
      } else {
        setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
      }

      // Ẩn loading screen nếu có lỗi
      hideLoading();
    }
  };

  return (
    <div className="auth-container">
      {successNotification && (
        <div className="custom-success">
          <div className="success-icon">✓</div>
          <div className="success-text">Đăng nhập thành công.</div>
        </div>
      )}

      <div className="logo-container">
        <img src={MBLogo} alt="MB Bank Logo" />
      </div>

      <h1 className="auth-title">Đăng nhập</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="tel"
          name="phone"
          placeholder="Số điện thoại"
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

        <div className="form-checkbox">
          {/* <input
            type="checkbox"
            name="rememberMe"
            id="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
          />
          <label htmlFor="rememberMe">Lưu mật khẩu</label> */}
        </div>

        <button type="submit" className="submit-button">
          Đăng nhập
        </button>

        {error && <p className="error-message">{error}</p>}
      </form>

      <div className="auth-footer">
        <p>
          Chưa có tài khoản? <a href="/signup">Đăng ký ngay</a>
        </p>
        <p>
          <a href="/forgot-password" className="forgot-password-link">
            Quên mật khẩu?
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
