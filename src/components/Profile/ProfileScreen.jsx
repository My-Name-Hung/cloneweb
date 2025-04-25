import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../assets/profile/default-avatar.svg";
import { useAuth } from "../../context/AuthContext";
import { imageApi } from "../../services/api";
import VerificationAlert from "../Verification/VerificationAlert";
import BottomNavigation from "../common/BottomNavigation";
import "./ProfileScreen.css";

// Add the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout, checkUserVerificationStatus, updateUserAvatar } =
    useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const notificationTimeoutRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    // Check verification status on component mount to get latest avatar - sửa để tránh loop vô hạn
    const fetchUserData = async () => {
      if (user && user.id && !checkComplete) {
        setIsLoading(true);
        try {
          const result = await checkUserVerificationStatus();
          if (result.success) {
            console.log(
              "Verification status updated:",
              result.verified ? "Verified" : "Not verified"
            );
            setCheckComplete(true);
          }
        } catch (error) {
          console.error("Error checking verification status:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, checkUserVerificationStatus, checkComplete]);

  // Set avatar URL whenever user changes - cải thiện logic cài đặt avatar
  useEffect(() => {
    if (user) {
      console.log("User data for avatar in ProfileScreen:", user);
      setIsLoading(true);

      // Hàm trợ giúp để fetch avatar từ API
      const fetchUserAvatar = async () => {
        if (!user.id) {
          console.log("No user ID available, cannot fetch avatar");
          setAvatarUrl(null);
          setIsLoading(false);
          return;
        }

        try {
          // Xác định URL đầy đủ API endpoint
          const avatarEndpoint = `${API_BASE_URL}/api/users/${user.id}/avatar`;
          console.log("Fetching avatar from:", avatarEndpoint);

          const response = await fetch(avatarEndpoint);
          const data = await response.json();

          console.log("Avatar API response:", data);

          if (data.success) {
            // Ưu tiên sử dụng fullAvatarUrl nếu có
            const avatarUrl =
              data.fullAvatarUrl || imageApi.getImageUrl(data.avatarUrl);
            console.log("Found avatar URL:", avatarUrl);
            setAvatarUrl(avatarUrl);

            // Cập nhật user.avatarUrl trong context nếu chưa có
            if (!user.avatarUrl && data.avatarUrl) {
              console.log("Updating user.avatarUrl in context");
              updateUserAvatar(data.avatarUrl);
            }
          } else {
            console.log("No avatar found from API, using default");
            setAvatarUrl(null);
          }
        } catch (error) {
          console.error("Error fetching avatar:", error);
          setAvatarUrl(null);
        } finally {
          setIsLoading(false);
        }
      };

      // Thứ tự ưu tiên:
      // 1. user.avatarUrl nếu đã có
      // 2. user.personalInfo.portraitImage nếu có
      // 3. Fetch từ API
      // 4. Sử dụng ảnh mặc định

      if (user.avatarUrl) {
        // Đảm bảo URL đầy đủ cho avatar
        const formattedUrl = imageApi.getImageUrl(user.avatarUrl);
        console.log("Using existing avatarUrl:", formattedUrl);
        setAvatarUrl(formattedUrl);
        setIsLoading(false);
      } else if (user.personalInfo && user.personalInfo.portraitImage) {
        // Thử lấy ảnh chân dung từ personalInfo nếu có
        const portraitUrl = imageApi.getImageUrl(
          user.personalInfo.portraitImage
        );
        console.log("Using portrait image as avatar:", portraitUrl);
        setAvatarUrl(portraitUrl);
        setIsLoading(false);
      } else {
        // Không có avatarUrl hoặc portraitImage, thử fetch từ API
        fetchUserAvatar();
      }
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Add a useEffect to log when user data changes - chỉ log, không cập nhật state
  useEffect(() => {
    if (user) {
      console.log("User data updated:", {
        id: user.id,
        verified: user.hasVerifiedDocuments,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      });
    }
  }, [user]);

  const handleLoanClick = () => {
    navigate("/my-contract");
  };

  const handlePersonalInfoClick = () => {
    const isUserVerified = user?.hasVerifiedDocuments === true;

    if (isUserVerified) {
      // If verified, navigate to profile detail page
      navigate("/profile-detail");
    } else {
      // If not verified, show notification
      setShowNotification(true);

      // Clear any existing timeout
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }

      // Set timeout to hide notification after 3 seconds
      notificationTimeoutRef.current = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  };

  const handleSupportClick = () => {
    navigate("/support");
  };

  const _handleHomeClick = () => {
    navigate("/");
  };

  const _handleWalletClick = () => {
    navigate("/wallet");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Kiểm tra người dùng đã xác minh chưa - Đã được cập nhật
  const isUserVerified = user?.hasVerifiedDocuments === true;

  // Thêm tiền tố _ để tránh lỗi linter, hoặc có thể xóa nếu không sử dụng
  const _getFullAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
      console.log("No avatar path provided, using default");
      return defaultAvatar;
    }

    // If it's already a full URL, return it
    if (avatarPath.startsWith("http")) {
      console.log("Avatar already has a full URL:", avatarPath);
      return avatarPath;
    }

    // Otherwise, prepend the API base URL
    const fullUrl = `${API_BASE_URL}${avatarPath}`;
    console.log("Created full avatar URL:", fullUrl);
    return fullUrl;
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h1 className="header-title">Hồ sơ</h1>
      </div>

      {/* Notification for unverified users - Only shown when triggered */}
      {showNotification && (
        <div className="verification-notification">
          <div className="notification-icon">i</div>
          <span>Bạn chưa xác minh danh tính.</span>
        </div>
      )}

      {/* User Info Section - Enhanced */}
      <div className="user-info-section">
        <div className="avatar-container">
          <img
            src={avatarUrl || defaultAvatar}
            alt="Avatar"
            className="user-avatar"
            onError={(e) => {
              console.log("Avatar failed to load, using default");
              e.target.onerror = null;
              e.target.src = defaultAvatar;
            }}
          />
        </div>
        <div className="user-info-text">
          {user?.fullName && <div className="user-name">{user.fullName}</div>}
          <div className="user-phone">{user?.phone || "0705007588"}</div>
        </div>
      </div>

      {/* Verification Alert - Chỉ hiển thị khi chưa xác minh */}
      {!isUserVerified && <VerificationAlert />}

      {/* Menu Items */}
      <div style={{ padding: "20px" }}>
        <div className="tab" onClick={handleLoanClick}>
          <span
            role="img"
            aria-label="dollar-circle"
            className="anticon anticon-dollar-circle"
            style={{
              color: "rgb(255, 255, 255)",
              fontSize: "25px",
              marginRight: "20px",
            }}
          >
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="dollar-circle"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm47.7-395.2l-25.4-5.9V348.6c38 5.2 61.5 29 65.5 58.2.5 4 3.9 6.9 7.9 6.9h44.9c4.7 0 8.4-4.1 8-8.8-6.1-62.3-57.4-102.3-125.9-109.2V263c0-4.4-3.6-8-8-8h-28.1c-4.4 0-8 3.6-8 8v33c-70.8 6.9-126.2 46-126.2 119 0 67.6 49.8 100.2 102.1 112.7l24.7 6.3v142.7c-44.2-5.9-69-29.5-74.1-61.3-.6-3.8-4-6.6-7.9-6.6H363c-4.7 0-8.4 4-8 8.7 4.5 55 46.2 105.6 135.2 112.1V761c0 4.4 3.6 8 8 8h28.4c4.4 0 8-3.6 8-8.1l-.2-31.7c78.3-6.9 134.3-48.8 134.3-124-.1-69.4-44.2-100.4-109-116.4zm-68.6-16.2c-5.6-1.6-10.3-3.1-15-5-33.8-12.2-49.5-31.9-49.5-57.3 0-36.3 27.5-57 64.5-61.7v124zM534.3 677V543.3c3.1.9 5.9 1.6 8.8 2.2 47.3 14.4 63.2 34.4 63.2 65.1 0 39.1-29.4 62.6-72 66.4z"></path>
            </svg>
          </span>
          <span
            className="ant-typography tab-text"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            Hợp đồng vay
          </span>
        </div>

        <div className="tab" onClick={handlePersonalInfoClick}>
          <span
            role="img"
            aria-label="user"
            className="anticon anticon-user"
            style={{
              color: "rgb(255, 255, 255)",
              fontSize: "25px",
              marginRight: "20px",
            }}
          >
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="user"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path>
            </svg>
          </span>
          <span
            className="ant-typography tab-text"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            Thông tin cá nhân
          </span>
        </div>

        <div className="tab" onClick={handleSupportClick}>
          <span
            role="img"
            aria-label="customer-service"
            className="anticon anticon-customer-service"
            style={{
              color: "rgb(255, 255, 255)",
              fontSize: "25px",
              marginRight: "20px",
            }}
          >
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="customer-service"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M512 128c-212.1 0-384 171.9-384 384v360c0 13.3 10.7 24 24 24h184c35.3 0 64-28.7 64-64V624c0-35.3-28.7-64-64-64H200v-48c0-172.3 139.7-312 312-312s312 139.7 312 312v48H688c-35.3 0-64 28.7-64 64v208c0 35.3 28.7 64 64 64h184c13.3 0 24-10.7 24-24V512c0-212.1-171.9-384-384-384z"></path>
            </svg>
          </span>
          <span
            className="ant-typography tab-text"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            Liên hệ tư vấn - hỗ trợ
          </span>
        </div>

        <div className="log-out">
          <button
            type="button"
            className="ant-btn ant-btn-default log-out-btn"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={handleLogout}
          >
            <span
              role="img"
              aria-label="logout"
              className="anticon anticon-logout"
              style={{ fontSize: "25px", color: "rgb(255, 255, 255)" }}
            >
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="logout"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M868 732h-70.3c-4.8 0-9.3 2.1-12.3 5.8-7 8.5-14.5 16.7-22.4 24.5a353.84 353.84 0 01-112.7 75.9A352.8 352.8 0 01512.4 866c-47.9 0-94.3-9.4-137.9-27.8a353.84 353.84 0 01-112.7-75.9 353.28 353.28 0 01-76-112.5C167.3 606.2 158 559.9 158 512s9.4-94.2 27.8-137.8c17.8-42.1 43.4-80 76-112.5s70.5-58.1 112.7-75.9c43.6-18.4 90-27.8 137.9-27.8 47.9 0 94.3 9.3 137.9 27.8 42.2 17.8 80.1 43.4 112.7 75.9 7.9 7.9 15.3 16.1 22.4 24.5 3 3.7 7.6 5.8 12.3 5.8H868c6.3 0 10.2-7 6.7-12.3C798 160.5 663.8 81.6 511.3 82 271.7 82.6 79.6 277.1 82 516.4 84.4 751.9 276.2 942 512.4 942c152.1 0 285.7-78.8 362.3-197.7 3.4-5.3-.4-12.3-6.7-12.3zm88.9-226.3L815 393.7c-5.3-4.2-13-.4-13 6.3v76H488c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112a8 8 0 000-12.6z"></path>
              </svg>
            </span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activePage="profile" />
    </div>
  );
};

export default ProfileScreen;
