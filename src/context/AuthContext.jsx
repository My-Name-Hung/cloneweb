import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

// Define API base URL with a fallback for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  const checkAuth = async () => {
    setLoading(true);
    try {
      console.log("Checking authentication...");
      const userData = localStorage.getItem("userData");

      if (!userData) {
        console.log("No user data found in localStorage");
        setUser(null);
        setLoading(false);
        return;
      }

      // Set user from localStorage
      setUser(JSON.parse(userData));
      console.log("User loaded from localStorage:", JSON.parse(userData));
    } catch (error) {
      console.error("Authentication check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      // For development purposes, allow a mock login
      if (phone === "0123456789" && password === "password") {
        console.log("Using mock login");
        const mockUserData = {
          id: "mock-user-id",
          phone: "0123456789",
          hasVerifiedDocuments: false,
          avatarUrl: null,
        };

        localStorage.setItem("userData", JSON.stringify(mockUserData));
        setUser(mockUserData);
        setLoading(false);
        return { success: true, message: "Đăng nhập thành công" };
      }

      // Real API login call
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        phone,
        password,
      });

      // Server returns { message: "Đăng nhập thành công", user: {...} }
      const userData = response.data.user;
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi đăng nhập.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("AuthContext: Logging out user");
    // Clear user from localStorage and state
    localStorage.removeItem("userData");
    setUser(null);
    return { success: true };
  };

  const checkVerificationStatus = async () => {
    console.log("AuthContext: Checking verification status");
    try {
      if (!user) {
        console.log("AuthContext: No user to check verification status");
        return { success: false, message: "Không có người dùng đăng nhập" };
      }

      console.log("AuthContext: Sending verification status request to API");
      const response = await axios.get(
        `${API_BASE_URL}/api/verification/status/${user.id}`
      );

      // Update user with latest verification status
      const updatedUser = {
        ...user,
        hasVerifiedDocuments: response.data.isVerified,
        avatarUrl: response.data.avatarUrl,
      };
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return {
        success: true,
        isVerified: response.data.isVerified,
        documents: response.data.documents,
      };
    } catch (error) {
      console.error("AuthContext: Verification status error:", error);
      return {
        success: false,
        message: "Không thể kiểm tra trạng thái xác minh",
      };
    }
  };

  const updateUser = (userData) => {
    if (!user) return { success: false, message: "No user logged in" };

    const updatedUser = { ...user, ...userData };
    localStorage.setItem("userData", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return { success: true, user: updatedUser };
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    checkAuth,
    checkVerificationStatus,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
