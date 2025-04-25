import React from "react";

export const LoadingState = ({ isLoading, children }) => {
  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return children;
};
