import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // For debugging
    const localStorageUser = localStorage.getItem("user");
    console.log("RequireAuth - AuthContext user:", user);
    console.log("RequireAuth - localStorage user:", localStorageUser);
  }, [user]);

  // If still loading, show a loading spinner
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Check both AuthContext and localStorage for a user
  const localStorageUser = localStorage.getItem("user");
  
  // If user is not logged in either way, redirect to login page
  if (!user && !localStorageUser) {
    console.log("RequireAuth - Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the protected component
  return children;
};

export default RequireAuth;
