import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import "../styles/AdminLogin.css";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const { login, isAuthenticated, loading, error: contextError } = useAdmin();
  const navigate = useNavigate();

  // Update error message if context error changes
  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);

  useEffect(() => {
    // If admin is already logged in, redirect to dashboard
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const { username, password } = formData;

    if (!username || !password) {
      setError("Vui lòng nhập cả tên đăng nhập và mật khẩu");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Attempting to login with username:", username);

      // Gọi API đăng nhập thông qua context
      const result = await login(username, password);

      // Increment login attempts counter
      setLoginAttempts((prev) => prev + 1);

      if (result.success) {
        setSuccessMessage("Đăng nhập thành công! Đang chuyển hướng...");

        // Redirect after a short delay
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1500);
      } else {
        setError(result.message || "Tên đăng nhập hoặc mật khẩu không đúng");
        console.error("Login failed:", result.message);

        // If it's the third failed attempt, provide more detailed help
        if (loginAttempts >= 2) {
          setError(
            `${
              result.message || "Đăng nhập thất bại"
            }. Vui lòng kiểm tra lại thông tin đăng nhập hoặc liên hệ quản trị viên để được trợ giúp.`
          );
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-form">
        <h1>Đăng nhập trang quản trị</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;
