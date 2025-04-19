import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MBLogo from "../../assets/logo/mblogo.png";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { authApi } from "../../services/api";
import "./AuthStyles.css";

const SignUp = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { login } = useAuth();
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

  // Auto-hide success notification after 3 seconds and navigate to home
  useEffect(() => {
    let timer;
    if (successNotification) {
      timer = setTimeout(() => {
        hideLoading();
        setSuccessNotification(false);
        navigate("/home");
      }, 3000);
    }

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
      // Đăng ký tài khoản
      const signupResponse = await authApi.signup({
        phone: formData.phone,
        password: formData.password,
      });

      console.log("Signup successful:", signupResponse);

      // Tự động đăng nhập sau khi đăng ký thành công
      const loginResult = await login(formData.phone, formData.password);

      if (loginResult.success) {
        // Hiển thị thông báo thành công
        hideLoading();
        setSuccessNotification(true);

        // Clear form
        setFormData({
          phone: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
        });
      } else {
        // Nếu đăng nhập thất bại sau khi đăng ký thành công
        hideLoading();
        setError(
          "Đăng ký thành công nhưng không thể tự động đăng nhập. Vui lòng đăng nhập thủ công."
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("Signup error:", err);

      // Check if this is a network error (API server not running or CORS issue)
      if (
        err.name === "TypeError" &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError"))
      ) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");

        // Cho môi trường development - auto login nếu server không khả dụng
        try {
          // Giả lập đăng nhập thành công
          const demoLoginResult = await login(
            formData.phone,
            formData.password
          );

          if (demoLoginResult.success) {
            hideLoading();
            setSuccessNotification(true);
          } else {
            throw new Error("Demo login failed");
          }
        } catch (loginErr) {
          hideLoading();
          console.error("Auto login failed:", loginErr);
          setError("Không thể đăng nhập tự động. Vui lòng thử lại sau.");
        }
      } else {
        setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
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
          <div className="success-text">
            Tạo tài khoản thành công. Đang chuyển hướng...
          </div>
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

        <input
          type="password"
          name="confirmPassword"
          placeholder="Nhập lại mật khẩu"
          className="form-inputs"
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
