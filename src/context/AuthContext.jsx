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
      const parsedUser = JSON.parse(userData);

      // Ensure avatar URL is properly formatted with API base URL if relative
      if (parsedUser.avatarUrl && !parsedUser.avatarUrl.startsWith("http")) {
        parsedUser.avatarUrl = `${API_BASE_URL}${parsedUser.avatarUrl}`;
      }

      setUser(parsedUser);
      console.log("User loaded from localStorage:", parsedUser);

      // Fetch latest bank info if user is logged in
      if (parsedUser && parsedUser.id) {
        try {
          const bankInfoRes = await axios.get(
            `${API_BASE_URL}/api/users/${parsedUser.id}/bank-info`
          );

          if (bankInfoRes.data.success && bankInfoRes.data.bankInfo) {
            console.log(
              "Retrieved bank info from API:",
              bankInfoRes.data.bankInfo
            );

            // Update user with latest bank info
            const updatedUser = {
              ...parsedUser,
              bankInfo: bankInfoRes.data.bankInfo,
            };

            // Update both state and localStorage
            setUser(updatedUser);
            localStorage.setItem("userData", JSON.stringify(updatedUser));
            console.log("User updated with bank info:", updatedUser);
          }
        } catch (bankInfoError) {
          console.error("Could not fetch bank info:", bankInfoError);
        }
      }
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

      // Fetch bank info immediately after login
      try {
        if (userData.id) {
          const bankInfoRes = await axios.get(
            `${API_BASE_URL}/api/users/${userData.id}/bank-info`
          );

          if (bankInfoRes.data.success && bankInfoRes.data.bankInfo) {
            // Include bank info in user data
            userData.bankInfo = bankInfoRes.data.bankInfo;
            console.log("Fetched bank info after login:", userData.bankInfo);
          }
        }
      } catch (bankInfoError) {
        console.error("Could not fetch bank info after login:", bankInfoError);
      }

      // Fetch user profile data immediately after login
      try {
        if (userData.id) {
          const profileRes = await axios.get(
            `${API_BASE_URL}/api/users/${userData.id}/profile`
          );

          if (profileRes.data.success) {
            // Include profile data in user data
            userData.fullName = profileRes.data.user.fullName;
            userData.personalInfo = profileRes.data.user.personalInfo;
            console.log("Fetched profile after login:", userData);
          }
        }
      } catch (profileError) {
        console.error("Could not fetch profile after login:", profileError);
      }

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

      // Format the avatar URL with the full API base URL if it's a relative path
      let avatarUrl = response.data.avatarUrl;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${API_BASE_URL}${avatarUrl}`;
      }

      // Update user with latest verification status and properly formatted avatar URL
      const updatedUser = {
        ...user,
        hasVerifiedDocuments: response.data.isVerified,
        avatarUrl: avatarUrl,
      };
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return {
        success: true,
        isVerified: response.data.isVerified,
        documents: response.data.documents,
        avatarUrl: avatarUrl,
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

  // Thêm hàm mới để cập nhật thông tin ngân hàng
  const updateBankInfo = async () => {
    if (!user || !user.id) {
      console.log(
        "Không thể cập nhật thông tin ngân hàng: Không có người dùng đăng nhập"
      );
      return { success: false, message: "Không có người dùng đăng nhập" };
    }

    try {
      console.log("Đang lấy thông tin ngân hàng từ server cho user:", user.id);
      const bankInfoRes = await axios.get(
        `${API_BASE_URL}/api/users/${user.id}/bank-info`
      );

      if (bankInfoRes.data.success && bankInfoRes.data.bankInfo) {
        // Cập nhật thông tin ngân hàng cho user
        const updatedUser = {
          ...user,
          bankInfo: bankInfoRes.data.bankInfo,
        };

        // Cập nhật cả state và localStorage
        localStorage.setItem("userData", JSON.stringify(updatedUser));
        setUser(updatedUser);

        console.log("Đã cập nhật thông tin ngân hàng:", updatedUser.bankInfo);
        return {
          success: true,
          message: "Cập nhật thông tin ngân hàng thành công",
          bankInfo: bankInfoRes.data.bankInfo,
        };
      }

      return {
        success: false,
        message: "Không tìm thấy thông tin ngân hàng",
      };
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin ngân hàng:", error);
      return {
        success: false,
        message: "Có lỗi khi lấy thông tin ngân hàng từ server",
      };
    }
  };

  const saveUserContract = async (contractData) => {
    if (!user || !user.id) {
      console.log("Không thể lưu hợp đồng: Không có người dùng đăng nhập");
      return { success: false, message: "Không có người dùng đăng nhập" };
    }

    try {
      console.log("Đang lưu hợp đồng cho user:", user.id);

      // Tạo mã hợp đồng và timestamp
      const contractId = Math.floor(
        10000000 + Math.random() * 90000000
      ).toString();
      const now = new Date();
      const createdTime = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const createdDate = now.toLocaleDateString("vi-VN");

      try {
        // Try to save to the API
        const response = await axios.post(`${API_BASE_URL}/api/contracts`, {
          userId: user.id,
          contractId,
          loanAmount: contractData.loanAmount,
          loanTerm: contractData.loanTerm,
          bankName: contractData.bankName || contractData.bank,
          signatureImage: contractData.signatureImage,
        });

        if (response.data.success) {
          console.log("Lưu hợp đồng vào server thành công");
          // Return the server response if successful
          return {
            success: true,
            message: "Lưu hợp đồng thành công",
            contract: response.data.contract,
          };
        }
      } catch (apiError) {
        console.error("Không thể lưu vào API, lưu vào localStorage:", apiError);
      }

      // Lưu vào localStorage như giải pháp dự phòng
      const contractInfo = {
        contractId,
        loanAmount: contractData.loanAmount,
        loanTerm: contractData.loanTerm,
        bankName: contractData.bankName || contractData.bank,
        signatureImage: contractData.signatureImage,
        createdTime,
        createdDate,
      };

      // Lưu hợp đồng vào localStorage với key riêng cho user
      const userContractsKey = `userContracts_${user.id}`;
      const savedContracts = JSON.parse(
        localStorage.getItem(userContractsKey) || "[]"
      );
      savedContracts.push(contractInfo);
      localStorage.setItem(userContractsKey, JSON.stringify(savedContracts));

      // Cập nhật thông tin user
      const updatedUser = {
        ...user,
        latestContract: contractInfo,
      };

      localStorage.setItem("userData", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return {
        success: true,
        message: "Lưu hợp đồng thành công",
        contract: contractInfo,
      };
    } catch (error) {
      console.error("Lỗi khi lưu hợp đồng:", error);
      return {
        success: false,
        message: error.message || "Có lỗi khi lưu hợp đồng",
      };
    }
  };

  const getUserContracts = async () => {
    if (!user || !user.id) {
      console.log("Không thể lấy hợp đồng: Không có người dùng đăng nhập");
      return { success: false, message: "Không có người dùng đăng nhập" };
    }

    try {
      console.log("Đang lấy danh sách hợp đồng cho user:", user.id);
      // Try to get from API
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${user.id}/contracts`
      );

      if (response.data.success) {
        console.log(
          "Lấy danh sách hợp đồng thành công:",
          response.data.contracts
        );

        // Store the API results in localStorage as a cache
        const userContractsKey = `userContracts_${user.id}`;
        localStorage.setItem(
          userContractsKey,
          JSON.stringify(response.data.contracts)
        );

        return response.data;
      }

      return { success: false, message: "Lấy danh sách hợp đồng thất bại" };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách hợp đồng từ API:", error);

      // Fallback to localStorage
      console.log("Đang thử lấy hợp đồng từ localStorage cho user:", user.id);
      const userContractsKey = `userContracts_${user.id}`;
      const savedContracts = localStorage.getItem(userContractsKey);

      if (savedContracts) {
        const contracts = JSON.parse(savedContracts);
        return {
          success: true,
          contracts: contracts,
        };
      }

      return {
        success: false,
        message: error.message || "Có lỗi khi lấy danh sách hợp đồng",
      };
    }
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
    updateBankInfo,
    saveUserContract,
    getUserContracts,
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
