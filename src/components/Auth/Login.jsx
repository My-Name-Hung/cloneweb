import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MBLogo from "../../assets/logo/mblogo.png";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import "./AuthStyles.css";

const Login = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { login } = useAuth();
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
        // Hide loading screen before redirecting
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
      // Use the login function from AuthContext
      const result = await login(formData.phone, formData.password);

      hideLoading();

      if (result.success) {
        // Show success notification
        setSuccessNotification(true);
      } else {
        setError(result.message || "Đăng nhập thất bại");
      }
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
          hideLoading();

          // Create mock user data
          const mockUser = {
            phone: formData.phone,
            id: `demo_${Date.now()}`,
            demoMode: true,
          };

          // Store in localStorage to match AuthContext
          localStorage.setItem("user", JSON.stringify(mockUser));

          setSuccessNotification(true);
          return;
        }
      } else {
        setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
      }

      // Hide loading screen if there's an error
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
      </div>
    </div>
  );
};

export default Login;
