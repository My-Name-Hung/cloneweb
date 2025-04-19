import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import LoanSelectionScreen from "./LoanSelectionScreen";
import "./LoanStyles.css";

const LoanScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      if (document.hidden) {
        // If the page is in background, it might be in a reload loop
        setHasError(true);
        console.error("Possible loading loop detected on loan screen");
      }
    }, 5000); // 5 seconds max loading time

    // Simulate API check to see if we can load the loan screen
    const checkLoanAccess = async () => {
      try {
        // Add any necessary API checks here
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading loan screen:", error);
        setIsLoading(false);
        setHasError(true);
      }
    };

    checkLoanAccess();

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Handle error state
  if (hasError) {
    return (
      <div className="loan-error-container">
        <h2>Không thể tải trang</h2>
        <p>Đã xảy ra lỗi khi tải trang khoản vay.</p>
        <button
          className="retry-button"
          onClick={() => {
            setIsLoading(true);
            setHasError(false);
            // Add a slight delay before navigating to avoid immediate reload
            setTimeout(() => navigate("/home"), 300);
          }}
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Main component
  return <LoanSelectionScreen />;
};

export default LoanScreen;
