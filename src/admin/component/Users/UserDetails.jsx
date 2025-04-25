import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "../../../context/AdminContext";
import "../../styles/UserDetails.css";
import { usersApi } from "../../utils/apiService";

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idCardInfo, setIdCardInfo] = useState(null);
  const [userLoans, setUserLoans] = useState([]);
  const [verificationDocs, setVerificationDocs] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { refreshSession } = useAdmin();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Handle authentication errors with debounce
  useEffect(() => {
    let debounceTimer;
    const handleAuthError = (event) => {
      if (event.detail?.url?.includes("/admin/users")) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (retryCount < 3) {
            setRetryCount((prev) => prev + 1);
          } else {
            setError(
              "Không thể tải thông tin người dùng. Vui lòng thử lại sau."
            );
            setLoading(false);
          }
        }, 1000);
      }
    };

    window.addEventListener("adminAuthError", handleAuthError);
    return () => {
      window.removeEventListener("adminAuthError", handleAuthError);
      clearTimeout(debounceTimer);
    };
  }, [retryCount]);

  // Fetch user details with all related data
  const fetchUserDetails = useCallback(async () => {
    if (isFetching) return;

    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);

      // Ensure token is fresh before making requests
      await refreshSession();

      // Fetch user details
      const userResponse = await usersApi.getUserDetails(userId);
      if (!userResponse.success) {
        throw new Error(
          userResponse.message || "Không thể tải thông tin người dùng"
        );
      }
      setUser(userResponse.user);

      // Fetch ID card info
      try {
        const idCardResponse = await usersApi.getUserIdCard(userId);
        if (idCardResponse.success) {
          console.log("ID Card info fetched:", idCardResponse.idCardInfo);
          setIdCardInfo({
            ...idCardResponse.idCardInfo,
            frontImage: getFullImageUrl(idCardResponse.idCardInfo.frontImage),
            backImage: getFullImageUrl(idCardResponse.idCardInfo.backImage),
          });
        }
      } catch (idCardError) {
        console.error("Error fetching ID card info:", idCardError);
      }

      // Fetch verification documents
      try {
        const verificationDocsResponse =
          await usersApi.getUserVerificationDocuments(userId);
        if (verificationDocsResponse.success) {
          setVerificationDocs(verificationDocsResponse.documents);
        }
      } catch (verificationError) {
        console.error(
          "Error fetching verification documents:",
          verificationError
        );
      }

      // Fetch user loans
      try {
        const loansResponse = await usersApi.getUserContracts(userId);
        if (loansResponse.success) {
          setUserLoans(loansResponse.contracts);
        }
      } catch (loansError) {
        console.error("Error fetching user loans:", loansError);
      }

      setIsDataFetched(true);
    } catch (error) {
      console.error("User details fetch error:", error);
      setError(error.message || "Lỗi khi tải thông tin người dùng");

      // Only retry on network errors and if we haven't exceeded max retries
      if (error.message?.includes("Network Error") && retryCount < 3) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [userId, refreshSession, retryCount, isFetching]);

  // Initial data fetch
  useEffect(() => {
    if (!isDataFetched && !isFetching) {
      fetchUserDetails();
    }
  }, [isDataFetched, isFetching, fetchUserDetails]);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      setLoading(true);
      await refreshSession();

      const response = await usersApi.deleteUser(userId);
      if (response.success) {
        navigate("/admin/users");
      } else {
        setError(response.message || "Không thể xóa người dùng");
      }
    } catch (error) {
      console.error("User delete error:", error);
      setError(error.response?.data?.message || "Lỗi khi xóa người dùng");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get full image URL
  const getFullImageUrl = useCallback(
    (path) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
    },
    [API_URL]
  );

  // Helper to display images with error handling
  const renderImage = useCallback((src, alt, className, fallbackText) => {
    if (!src) {
      console.log(`No image source provided for ${alt}`);
      return <div className="id-card-placeholder">{fallbackText}</div>;
    }

    console.log(`Rendering image for ${alt} with src:`, src);
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={(e) => {
          console.error(`Error loading image ${alt}:`, e);
          e.target.onerror = null;
          e.target.style.display = "none";
          e.target.parentNode.innerHTML = `<div class="id-card-placeholder">${fallbackText}</div>`;
        }}
      />
    );
  }, []);

  if (loading && !isDataFetched) {
    return (
      <div className="admin-content-container">
        <div className="admin-content-header">
          <h1>Chi tiết người dùng</h1>
        </div>
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content-container">
        <div className="admin-content-header">
          <h1>Chi tiết người dùng</h1>
        </div>
        <div className="admin-error-message">
          <p>{error}</p>
          <button
            className="admin-button"
            onClick={() => {
              if (!loading) {
                setIsDataFetched(false);
                setRetryCount(0);
                fetchUserDetails();
              }
            }}
            disabled={loading}
          >
            {loading ? "Đang tải lại..." : "Thử lại"}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-content-container">
        <div className="admin-content-header">
          <h1>Chi tiết người dùng</h1>
        </div>
        <div className="admin-error-message">
          <p>Không tìm thấy người dùng</p>
          <button
            className="admin-button"
            onClick={() => navigate("/admin/users")}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-details-container">
      <div className="admin-page-header">
        <h1>Chi tiết người dùng</h1>
        <div className="action-buttons">
          <button
            className="action-button back"
            onClick={() => navigate("/admin/users")}
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>

          <Link
            to={`/admin/users/${userId}/edit`}
            className="action-button edit"
          >
            <i className="fas fa-edit"></i>
            Chỉnh sửa
          </Link>

          <button className="action-button delete" onClick={handleDelete}>
            <i className="fas fa-trash"></i>
            Xóa
          </button>
        </div>
      </div>

      <div className="user-details-content">
        <div className="user-info-section">
          <h2>Thông tin cơ bản</h2>

          <div className="user-avatar-container">
            {user.avatarUrl ? (
              <img
                src={getFullImageUrl(user.avatarUrl)}
                alt="Ảnh đại diện"
                className="user-avatar"
              />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-user"></i>
              </div>
            )}
            <span
              className={`avatar-status ${
                user.hasVerifiedDocuments ? "verified" : "pending"
              }`}
            >
              {user.hasVerifiedDocuments ? "Đã xác thực" : "Chờ xác thực"}
            </span>
          </div>

          <div className="user-data-grid">
            <div className="detail-item">
              <span className="detail-label">Số điện thoại:</span>
              <span className="detail-value">{user.phone}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Họ và tên:</span>
              <span className="detail-value">
                {user.fullName || "Chưa cập nhật"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Trạng thái xác thực:</span>
              <span
                className={`status-badge ${
                  user.hasVerifiedDocuments ? "success" : "pending"
                }`}
              >
                {user.hasVerifiedDocuments ? "Đã xác thực" : "Chờ xác thực"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Ngày tạo:</span>
              <span className="detail-value">
                {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ID Card Information */}
        <div className="user-info-section">
          <h2>Thông tin CMND/CCCD</h2>
          <div className="id-card-images">
            <div className="id-card-image-container">
              <h3>Mặt trước</h3>
              {renderImage(
                idCardInfo?.frontImage,
                "CMND/CCCD mặt trước",
                "id-card-image",
                "Chưa có ảnh mặt trước"
              )}
            </div>

            <div className="id-card-image-container">
              <h3>Mặt sau</h3>
              {renderImage(
                idCardInfo?.backImage,
                "CMND/CCCD mặt sau",
                "id-card-image",
                "Chưa có ảnh mặt sau"
              )}
            </div>
          </div>

          <div className="user-data-grid">
            <div className="detail-item">
              <span className="detail-label">Số CMND/CCCD:</span>
              <span className="detail-value">
                {(idCardInfo && idCardInfo.idNumber) ||
                  (user.personalInfo && user.personalInfo.idNumber) ||
                  "Chưa cập nhật"}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        {verificationDocs && (
          <div className="user-info-section">
            <h2>Tài liệu xác minh</h2>

            <div className="id-card-images">
              <div className="id-card-image-container">
                <h3>Mặt trước (KYC)</h3>
                {renderImage(
                  verificationDocs.frontId,
                  "CMND/CCCD mặt trước (KYC)",
                  "id-card-image",
                  "Chưa có ảnh mặt trước"
                )}
              </div>

              <div className="id-card-image-container">
                <h3>Mặt sau (KYC)</h3>
                {renderImage(
                  verificationDocs.backId,
                  "CMND/CCCD mặt sau (KYC)",
                  "id-card-image",
                  "Chưa có ảnh mặt sau"
                )}
              </div>

              <div className="id-card-image-container">
                <h3>Ảnh chân dung</h3>
                {renderImage(
                  verificationDocs.portrait,
                  "Ảnh chân dung",
                  "id-card-image",
                  "Chưa có ảnh chân dung"
                )}
              </div>
            </div>
          </div>
        )}

        {user.personalInfo && (
          <div className="user-info-section">
            <h2>Thông tin cá nhân</h2>

            <div className="user-data-grid">
              <div className="detail-item">
                <span className="detail-label">Giới tính:</span>
                <span className="detail-value">
                  {user.personalInfo.gender === "male" ? "Nam" : "Nữ"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Ngày sinh:</span>
                <span className="detail-value">
                  {new Date(user.personalInfo.birthDate).toLocaleDateString(
                    "vi-VN"
                  )}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Nghề nghiệp:</span>
                <span className="detail-value">
                  {user.personalInfo.occupation || "Chưa cập nhật"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Thu nhập:</span>
                <span className="detail-value">
                  {user.personalInfo.income
                    ? `${parseFloat(
                        user.personalInfo.income
                      ).toLocaleString()} VNĐ`
                    : "Chưa cập nhật"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Mục đích vay:</span>
                <span className="detail-value">
                  {user.personalInfo.loanPurpose || "Chưa cập nhật"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Địa chỉ:</span>
                <span className="detail-value">
                  {user.personalInfo.address || "Chưa cập nhật"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Người liên hệ:</span>
                <span className="detail-value">
                  {user.personalInfo.contactPerson || "Chưa cập nhật"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Mối quan hệ:</span>
                <span className="detail-value">
                  {user.personalInfo.relationship || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>
        )}

        {user.bankInfo && (
          <div className="user-info-section">
            <h2>Thông tin ngân hàng</h2>

            <div className="user-data-grid">
              <div className="detail-item">
                <span className="detail-label">Số tài khoản:</span>
                <span className="detail-value">
                  {user.bankInfo.accountNumber || "Chưa cập nhật"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Tên tài khoản:</span>
                <span className="detail-value">
                  {user.bankInfo.accountName || "Chưa cập nhật"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Ngân hàng:</span>
                <span className="detail-value">
                  {user.bankInfo.bank || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* User's Loans */}
        {userLoans.length > 0 && (
          <div className="user-info-section">
            <h2>Hợp đồng vay</h2>

            <div className="user-loans-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã hợp đồng</th>
                    <th>Số tiền</th>
                    <th>Kỳ hạn</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {userLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.contractId}</td>
                      <td>
                        {parseFloat(loan.loanAmount).toLocaleString()} VNĐ
                      </td>
                      <td>{loan.loanTerm} tháng</td>
                      <td>
                        {new Date(loan.createdDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <Link
                          to={`/admin/loans/${loan.id}`}
                          className="action-button edit"
                        >
                          <i className="fas fa-eye"></i>
                          Xem
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(UserDetails);
