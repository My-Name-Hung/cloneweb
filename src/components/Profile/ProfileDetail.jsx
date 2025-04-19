import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../assets/profile/default-avatar.svg";
import { useAuth } from "../../context/AuthContext";
import { imageApi } from "../../services/api";
import "./ProfileDetail.css";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

const ProfileDetail = () => {
  const navigate = useNavigate();
  const { user, checkUserVerificationStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [bankData, setBankData] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async () => {
    if (user && user.id) {
      try {
        setRefreshing(true);

        // Use the checkUserVerificationStatus function to get the latest data
        const verificationResult = await checkUserVerificationStatus();
        console.log("Verification result:", verificationResult);

        // Directly fetch the latest profile and bank info
        try {
          const [profileRes, bankInfoRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/users/${user.id}/profile`),
            axios.get(`${API_BASE_URL}/api/users/${user.id}/bank-info`),
          ]);

          if (profileRes.data && profileRes.data.success) {
            setProfileData(profileRes.data.user);
          } else {
            // Fallback to local data
            setProfileData(user);
          }

          if (bankInfoRes.data && bankInfoRes.data.success) {
            setBankData(bankInfoRes.data.bankInfo);
          } else {
            // Fallback to local data
            setBankData(user?.bankInfo);
          }
        } catch (apiError) {
          console.error("API error fetching user data:", apiError);
          // Fallback to local data
          setProfileData(user);
          setBankData(user?.bankInfo);
        }

        // Try to get avatar from API
        try {
          const avatar = await imageApi.getUserAvatar(user.id);
          if (avatar) {
            setAvatarUrl(avatar);
          } else if (user.avatarUrl) {
            // Fallback to user.avatarUrl if available
            setAvatarUrl(getFullImageUrl(user.avatarUrl));
          }
        } catch (avatarError) {
          console.error("Error fetching avatar:", avatarError);
          if (user.avatarUrl) {
            setAvatarUrl(getFullImageUrl(user.avatarUrl));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    fetchUserData();
  };

  // Helper function to ensure full image URL
  const getFullImageUrl = (url) => {
    if (!url) return defaultAvatar;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  if (isLoading) {
    return (
      <div className="profile-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Format bank account number to show as asterisks or actual number
  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return "* * * * * * * * * *";
    return showAccountNumber ? accountNumber : "* * * * * * * * * *";
  };

  // Toggle account number visibility
  const toggleAccountNumberVisibility = () => {
    setShowAccountNumber(!showAccountNumber);
  };

  // Combine data sources for display - prioritize fetched data over local
  const displayData = {
    fullName: profileData?.fullName || user?.fullName || "Chưa cập nhật",
    address:
      profileData?.personalInfo?.address ||
      user?.personalInfo?.address ||
      "Chưa cập nhật",
    idNumber:
      profileData?.personalInfo?.idNumber ||
      user?.personalInfo?.idNumber ||
      "Chưa cập nhật",
    gender:
      profileData?.personalInfo?.gender ||
      user?.personalInfo?.gender ||
      "Chưa cập nhật",
    birthDate:
      profileData?.personalInfo?.birthDate ||
      user?.personalInfo?.birthDate ||
      "Chưa cập nhật",
    occupation:
      profileData?.personalInfo?.occupation ||
      user?.personalInfo?.occupation ||
      "Chưa cập nhật",
    income:
      profileData?.personalInfo?.income ||
      user?.personalInfo?.income ||
      "Chưa cập nhật",
    loanPurpose:
      profileData?.personalInfo?.loanPurpose ||
      user?.personalInfo?.loanPurpose ||
      "Chưa cập nhật",
    contactPerson:
      profileData?.personalInfo?.contactPerson ||
      user?.personalInfo?.contactPerson ||
      "Chưa cập nhật",
    relationship:
      profileData?.personalInfo?.relationship ||
      user?.personalInfo?.relationship ||
      "Chưa cập nhật",
    bank: bankData?.bank || user?.bankInfo?.bank || "Chưa cập nhật",
    accountNumber:
      bankData?.accountNumber || user?.bankInfo?.accountNumber || "",
    accountName:
      bankData?.accountName || user?.bankInfo?.accountName || "Chưa cập nhật",
    phone: profileData?.phone || user?.phone || "Chưa cập nhật",
  };

  return (
    <div className="profile-detail-container">
      {/* Header */}
      <div className="profile-detail-header">
        <button className="back-button" onClick={handleBackClick}>
          <svg
            viewBox="64 64 896 896"
            focusable="false"
            data-icon="left"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
          </svg>
        </button>
        <h1 className="header-title">Thông tin cá nhân</h1>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <svg
            viewBox="64 64 896 896"
            focusable="false"
            data-icon="reload"
            width="1em"
            height="1em"
            fill="currentColor"
            className={refreshing ? "spinning" : ""}
          >
            <path d="M909.1 209.3l-56.4 44.1C775.8 155.1 656.2 92 521.9 92 290 92 102.3 279.5 102 511.5 101.7 743.7 289.8 932 521.9 932c181.3 0 335.8-115 394.6-276.1 1.5-4.2-.7-8.9-4.9-10.3l-56.7-19.5a8 8 0 00-10.1 4.8c-1.8 5-3.8 10-5.9 14.9-17.3 41-42.1 77.8-73.7 109.4A344.77 344.77 0 01521.9 832c-152.8 0-277.2-124.4-277.2-277.2 0-152.8 124.4-277.2 277.2-277.2 94.9 0 178.5 48.5 227.4 122.1l-65.5 50.9c-10.2 7.9-5.9 24.2 7.2 24.2h175.4c5.8 0 10.5-4.7 10.5-10.5V217c0-13.5-16.7-17.7-26.8-9.7z"></path>
          </svg>
        </button>
      </div>

      {refreshing && (
        <div className="refresh-indicator">
          <div className="refresh-spinner"></div>
          <p>Đang cập nhật...</p>
        </div>
      )}

      {/* Avatar and ID Number Section */}
      <div className="id-card-section avatar-section">
        <div className="avatar-container">
          <img
            src={avatarUrl || defaultAvatar}
            alt="Ảnh đại diện"
            className="user-avatar"
            onError={(e) => {
              console.error("Error loading avatar image:", e);
              e.target.onerror = null;
              e.target.src = defaultAvatar;
            }}
          />
        </div>
        <div className="id-number">{displayData.phone}</div>
      </div>

      {/* Personal Information Section */}
      <div className="info-section">
        <h2 className="section-title">Thông tin</h2>

        <div className="info-row">
          <div className="info-label">Họ tên :</div>
          <div className="info-value">{displayData.fullName}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Địa chỉ :</div>
          <div className="info-value">{displayData.address}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Số CMND/CCCD :</div>
          <div className="info-value">{displayData.idNumber}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Giới tính :</div>
          <div className="info-value">{displayData.gender}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Ngày sinh :</div>
          <div className="info-value">{displayData.birthDate}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Nghề nghiệp :</div>
          <div className="info-value">{displayData.occupation}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Thu nhập :</div>
          <div className="info-value">{displayData.income}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Mục đích khoản vay :</div>
          <div className="info-value">{displayData.loanPurpose}</div>
        </div>

        <div className="info-row">
          <div className="info-label">SĐT người thân :</div>
          <div className="info-value">{displayData.contactPerson}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Mối quan hệ với người thân :</div>
          <div className="info-value">{displayData.relationship}</div>
        </div>
      </div>

      {/* Bank Account Section */}
      <div className="bank-account-section">
        <h2 className="section-title">Tài khoản ngân hàng</h2>

        <div className="info-row">
          <div className="info-label">Tên ngân hàng :</div>
          <div className="info-value">{displayData.bank}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Số TK ngân hàng :</div>
          <div className="info-value">
            {formatAccountNumber(displayData.accountNumber)}
            <span
              className="view-password-icon"
              onClick={toggleAccountNumberVisibility}
            >
              {showAccountNumber ? (
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  data-icon="eye"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z" />
                </svg>
              ) : (
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  data-icon="eye-invisible"
                  width="1em"
                  height="1em"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z"></path>
                  <path d="M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z"></path>
                </svg>
              )}
            </span>
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Tên thụ hưởng :</div>
          <div className="info-value">{displayData.accountName}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;
