import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, loading, setUser } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // If user already exists in context, we're authenticated
        if (user) {
          console.log("User found in context:", user);
          setAuthChecked(true);
          return;
        }

        // If user is not in context, check localStorage
        const userData = localStorage.getItem("userData");

        if (userData) {
          console.log("User found in localStorage, updating context");
          setUser(JSON.parse(userData));
          setAuthChecked(true);
        } else {
          console.log("No user session found, redirecting to login");
          setAuthChecked(true);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setAuthChecked(true);
      }
    };

    // Only run the check when loading is complete
    if (!loading) {
      checkAuthentication();
    }
  }, [user, loading, setUser]);

  // If still checking authentication, show nothing (or a loader)
  if (loading || !authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // After checking, if no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated
  return children;
};

export default RequireAuth;
