import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./ProfileDetail.css";

const ProfileDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after a short delay to simulate data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleBackClick = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="profile-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Format bank account number to show as asterisks
  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return "* * * * * * * * * *";
    return "* * * * * * * * * *";
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
      </div>

      {/* ID Card Image and Number */}
      <div className="id-card-section">
        <div className="id-card-image">
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjcwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5Ij5DQ0NEL0NNTkQ8L3RleHQ+PC9zdmc+"
            alt="ID Card"
          />
        </div>
        <div className="id-number">0705007516</div>
      </div>

      {/* Personal Information Section */}
      <div className="info-section">
        <h2 className="section-title">Thông tin</h2>

        <div className="info-row">
          <div className="info-label">Họ tên :</div>
          <div className="info-value">
            {user?.fullName || "Nguyễn Văn Linh"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Địa chỉ :</div>
          <div className="info-value">
            {user?.personalInfo?.address || "213 ấp 5, trà vinh"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Số CMND/CCCD :</div>
          <div className="info-value">
            {user?.personalInfo?.idNumber || "080202007004"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Giới tính :</div>
          <div className="info-value">
            {user?.personalInfo?.gender || "Nam"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Ngày sinh :</div>
          <div className="info-value">
            {user?.personalInfo?.birthDate || "11/11/1975"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Nghề nghiệp :</div>
          <div className="info-value">
            {user?.personalInfo?.occupation || "nông dân"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Thu nhập :</div>
          <div className="info-value">
            {user?.personalInfo?.income || "Từ 5 - 10 triệu"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Mục đích khoản vay :</div>
          <div className="info-value">
            {user?.personalInfo?.loanPurpose || "tiêu dùng"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">SĐT người thân :</div>
          <div className="info-value">
            {user?.personalInfo?.contactPerson || "0705007519"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Mối quan hệ với người thân :</div>
          <div className="info-value">
            {user?.personalInfo?.relationship || "bạn"}
          </div>
        </div>
      </div>

      {/* Bank Account Section */}
      <div className="bank-account-section">
        <h2 className="section-title">Tài khoản ngân hàng</h2>

        <div className="info-row">
          <div className="info-label">Tên ngân hàng :</div>
          <div className="info-value">
            {user?.bankInfo?.bank ||
              "Ngân hàng Đầu tư và Phát triển Việt Nam ( BIDV )"}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Số TK ngân hàng :</div>
          <div className="info-value">
            {formatAccountNumber(user?.bankInfo?.accountNumber)}
            <span className="view-password-icon">
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
            </span>
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Tên thụ hưởng :</div>
          <div className="info-value">
            {user?.bankInfo?.accountName || "hung"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;
