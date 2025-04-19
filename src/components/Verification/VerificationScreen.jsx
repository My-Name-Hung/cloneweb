import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { saveImage } from "../../database/storageService";
import "./VerificationStyles.css";

// Thêm API_BASE_URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

const VerificationScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkUserVerificationStatus, updateUserAvatar } = useAuth();
  const [frontIdImage, setFrontIdImage] = useState(null);
  const [backIdImage, setBackIdImage] = useState(null);
  const [portraitImage, setPortraitImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Use user ID from auth context or fallback to a default
  const userId = user?.id || "user123";

  // Display status message from navigation if available
  useEffect(() => {
    if (location.state?.message) {
      setStatusMessage(location.state.message);
      // Clear the message after 3 seconds
      const timer = setTimeout(() => setStatusMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Check if user already has verification documents
  useEffect(() => {
    const checkUserDocuments = async () => {
      try {
        const result = await checkUserVerificationStatus();
        if (result.success && result.verified) {
          // Người dùng đã được xác minh, hiển thị thông báo và chuyển hướng sau 2 giây
          setStatusMessage(
            "Tài khoản đã được xác minh trước đó! Đang chuyển hướng..."
          );

          // Kiểm tra xem có đường dẫn redirect lưu trước đó không
          const redirectPath = localStorage.getItem(
            "redirectAfterVerification"
          );

          setTimeout(() => {
            if (redirectPath) {
              localStorage.removeItem("redirectAfterVerification");
              navigate(redirectPath);
            } else {
              navigate("/profile");
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };

    checkUserDocuments();
  }, [checkUserVerificationStatus, navigate]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleImageUpload = (event, setImageFunction, imageType) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setImageFunction(imageData);

        // In a real app, we might want to upload immediately or wait for user confirmation
        console.log(`${imageType} image selected, ready for upload`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    try {
      setIsUploading(true);
      setStatusMessage("Đang xử lý...");

      console.log("Bắt đầu upload ảnh với userId:", userId);

      // Lưu tất cả ảnh - đảm bảo portrait cuối cùng
      const frontIdResult = await saveImage(
        userId,
        "document",
        frontIdImage,
        "frontId"
      );
      console.log("Front ID upload result:", frontIdResult);

      const backIdResult = await saveImage(
        userId,
        "document",
        backIdImage,
        "backId"
      );
      console.log("Back ID upload result:", backIdResult);

      // Upload portrait cuối cùng để đảm bảo nó được sử dụng làm avatar
      console.log("Uploading portrait image...");
      const portraitResult = await saveImage(userId, "portrait", portraitImage);
      console.log("Portrait upload result:", portraitResult);

      // Xử lý kết quả portrait upload
      let portraitUrl = null;

      // Xử lý các trường hợp khác nhau của kết quả
      if (typeof portraitResult === "string") {
        // Nếu kết quả là string URL trực tiếp
        portraitUrl = portraitResult;
        console.log("Portrait result is a direct URL:", portraitUrl);
      } else if (portraitResult && typeof portraitResult === "object") {
        // Nếu kết quả là object
        if (portraitResult.fullUrl) {
          portraitUrl = portraitResult.fullUrl;
        } else if (portraitResult.fileUrl) {
          portraitUrl = portraitResult.fileUrl;
        } else if (portraitResult.filePath) {
          portraitUrl =
            API_BASE_URL +
            (portraitResult.filePath.startsWith("/")
              ? portraitResult.filePath
              : `/${portraitResult.filePath}`);
        }
        console.log("Extracted portrait URL from object:", portraitUrl);
      }

      // Nếu có URL, cập nhật avatar
      if (portraitUrl) {
        console.log("Updating user avatar with URL:", portraitUrl);
        updateUserAvatar(portraitUrl);
        setStatusMessage("Đã cập nhật avatar thành công!");
      } else {
        console.error(
          "Không thể lấy được URL portrait từ kết quả:",
          portraitResult
        );
      }

      // Force reload user data from server to get latest status
      console.log("Reloading user verification status...");
      await checkUserVerificationStatus();

      // Đợi một chút để người dùng thấy thông báo thành công
      setTimeout(() => {
        // Navigate to the personal information form after successful verification
        navigate("/personal-info", {
          state: {
            verificationComplete: true,
            message:
              "Xác minh thành công! Vui lòng cung cấp thông tin cá nhân.",
          },
        });
      }, 1000);
    } catch (error) {
      console.error("Error uploading documents:", error);
      setStatusMessage("Lỗi khi tải lên tài liệu. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  // Check if all required images are uploaded
  const allImagesUploaded = frontIdImage && backIdImage && portraitImage;

  return (
    <div className="verification-container">
      {statusMessage && <div className="status-message">{statusMessage}</div>}

      <header className="verification-header">
        <button className="back-button" onClick={handleBackClick}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19L8 12L15 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="header-title">Xác minh</h1>
      </header>

      <div className="verification-content">
        <h2 className="verification-title">Chụp ảnh định danh KYC</h2>

        <div className="upload-card">
          {frontIdImage ? (
            <img
              src={frontIdImage}
              alt="Mặt trước CMND / CCCD"
              className="uploaded-image"
            />
          ) : (
            <>
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="camera"
                className="camera-icon"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M864 248H728l-32.4-90.8a32.07 32.07 0 00-30.2-21.2H358.6c-13.5 0-25.6 8.5-30.1 21.2L296 248H160c-44.2 0-80 35.8-80 80v456c0 44.2 35.8 80 80 80h704c44.2 0 80-35.8 80-80V328c0-44.2-35.8-80-80-80zm8 536c0 4.4-3.6 8-8 8H160c-4.4 0-8-3.6-8-8V328c0-4.4 3.6-8 8-8h186.7l17.1-47.8 22.9-64.2h250.5l22.9 64.2 17.1 47.8H864c4.4 0 8 3.6 8 8v456zM512 384c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160-71.6-160-160-160zm0 256c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z"></path>
              </svg>
              <div className="upload-label">Mặt trước CMND / CCCD</div>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="upload-input"
            onChange={(e) => handleImageUpload(e, setFrontIdImage, "frontId")}
            capture="environment"
          />
        </div>

        <div className="upload-card">
          {backIdImage ? (
            <img
              src={backIdImage}
              alt="Mặt sau CMND / CCCD"
              className="uploaded-image"
            />
          ) : (
            <>
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="camera"
                className="camera-icon"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M864 248H728l-32.4-90.8a32.07 32.07 0 00-30.2-21.2H358.6c-13.5 0-25.6 8.5-30.1 21.2L296 248H160c-44.2 0-80 35.8-80 80v456c0 44.2 35.8 80 80 80h704c44.2 0 80-35.8 80-80V328c0-44.2-35.8-80-80-80zm8 536c0 4.4-3.6 8-8 8H160c-4.4 0-8-3.6-8-8V328c0-4.4 3.6-8 8-8h186.7l17.1-47.8 22.9-64.2h250.5l22.9 64.2 17.1 47.8H864c4.4 0 8 3.6 8 8v456zM512 384c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160-71.6-160-160-160zm0 256c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z"></path>
              </svg>
              <div className="upload-label">Mặt sau CMND / CCCD</div>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="upload-input"
            onChange={(e) => handleImageUpload(e, setBackIdImage, "backId")}
            capture="environment"
          />
        </div>

        <div className="upload-card">
          {portraitImage ? (
            <img
              src={portraitImage}
              alt="Ảnh chân dung"
              className="uploaded-image"
            />
          ) : (
            <>
              <svg
                viewBox="64 64 896 896"
                focusable="false"
                data-icon="camera"
                className="camera-icon"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M864 248H728l-32.4-90.8a32.07 32.07 0 00-30.2-21.2H358.6c-13.5 0-25.6 8.5-30.1 21.2L296 248H160c-44.2 0-80 35.8-80 80v456c0 44.2 35.8 80 80 80h704c44.2 0 80-35.8 80-80V328c0-44.2-35.8-80-80-80zm8 536c0 4.4-3.6 8-8 8H160c-4.4 0-8-3.6-8-8V328c0-4.4 3.6-8 8-8h186.7l17.1-47.8 22.9-64.2h250.5l22.9 64.2 17.1 47.8H864c4.4 0 8 3.6 8 8v456zM512 384c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160-71.6-160-160-160zm0 256c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z"></path>
              </svg>
              <div className="upload-label">Ảnh chân dung</div>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="upload-input"
            onChange={(e) => handleImageUpload(e, setPortraitImage, "portrait")}
            capture="user"
          />
        </div>

        <button
          className="continue-button"
          onClick={handleContinue}
          disabled={!allImagesUploaded || isUploading}
        >
          {isUploading ? "Đang xử lý..." : "Tiếp tục"}
        </button>
      </div>
    </div>
  );
};

export default VerificationScreen;
