import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MBLogo from "../../assets/logo/mblogo.png";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import "./AuthStyles.css";

const Login = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { login } = useAuth();
  const { login: adminLogin } = useAdmin();
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [successNotification, setSuccessNotification] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auto-hide success notification after 3 seconds and redirect to home
  useEffect(() => {
    let timer;
    if (successNotification) {
      console.log("Login: Success notification showing, will redirect");

      timer = setTimeout(() => {
        // Hide loading screen before redirecting
        hideLoading();
        setSuccessNotification(false);

        // Chuyển hướng dựa trên vai trò người dùng
        if (isAdmin) {
          console.log("Login: Redirecting to admin dashboard");
          navigate("/admin", { replace: true });
        } else {
          console.log("Login: Redirecting to home page");
          navigate("/", { replace: true });
        }
      }, 3000);
    }

    // Clean up timer on unmount or when successNotification changes
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [successNotification, navigate, hideLoading, isAdmin]);

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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    // Show global loading screen
    showLoading();
    console.log("Login: Submitting login form");

    // Kiểm tra nếu đăng nhập với tài khoản admin
    if (formData.phone === "admin" && formData.password === "123456") {
      try {
        console.log("Login: Detected admin credentials");
        const adminResult = await adminLogin(formData.phone, formData.password);

        hideLoading();

        if (adminResult.success) {
          console.log("Login: Admin login successful");
          setIsAdmin(true);
          setSuccessNotification(true);
        } else {
          console.log("Login: Admin login failed:", adminResult.message);
          setError(adminResult.message || "Đăng nhập thất bại");
        }
      } catch (err) {
        console.error("Login: Error during admin login:", err);
        setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
        hideLoading();
      }
      return;
    }

    try {
      // Đăng nhập người dùng thông thường
      console.log("Login: Calling regular user login function");
      const result = await login(formData.phone, formData.password);
      console.log("Login: Login result:", result);

      hideLoading();

      if (result.success) {
        console.log("Login: Login successful, showing notification");
        // Show success notification
        setSuccessNotification(true);
      } else {
        console.log("Login: Login failed:", result.message);
        setError(result.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      // Handle network errors or server errors
      console.error("Login: Error during login:", err);

      // Check if this is a network error (API server not running or CORS issue)
      if (
        err.name === "TypeError" &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError"))
      ) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");

        // For demo or development purposes - auto login if server is not reachable
        if (formData.phone && formData.password) {
          hideLoading();
          console.log("Login: Using mock login for development");

          // Create mock user data
          const mockUser = {
            phone: formData.phone,
            id: `demo_${Date.now()}`,
            demoMode: true,
          };

          // Store in localStorage to match AuthContext
          localStorage.setItem("user", JSON.stringify(mockUser));
          console.log("Login: Mock user stored in localStorage");

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
          placeholder="Số điện thoại/Tên đăng nhập"
          className="form-inputs"
          value={formData.phone}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          className="form-inputs"
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
