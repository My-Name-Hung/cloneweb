import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

// Create the auth context
const AuthContext = createContext();

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        console.log("AuthContext - Checking for stored user:", storedUser);

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log("AuthContext - Found user data:", userData);

          // Set the user in state
          setUser(userData);
          console.log("AuthContext - User set in state");
        } else {
          console.log("AuthContext - No stored user found");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (phone, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        phone,
        password,
      });

      const userData = response.data.user;
      setUser(userData);

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      return { success: true, data: userData };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Check verification status
  const checkVerificationStatus = async () => {
    if (!user?.id) return false;

    try {
      const response = await axios.get(
        `${API_URL}/api/verification/status/${user.id}`
      );

      // Update user data with latest verification status
      const updatedUser = {
        ...user,
        hasVerifiedDocuments: response.data.isVerified,
        avatarUrl: response.data.avatarUrl || user.avatarUrl,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return response.data.isVerified;
    } catch (error) {
      console.error("Verification check error:", error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkVerificationStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
