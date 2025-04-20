import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { imageApi } from "../services/api";

// Define API base URL with a fallback for development
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

// Debug logging để kiểm tra URL
console.log("API_BASE_URL used in AuthContext:", API_BASE_URL);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add this function to ensure avatar URLs are processed correctly
  const ensureFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  // Update the checkAuth function
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
      console.log("User data from localStorage:", parsedUser);

      // Ensure avatar URL is a full URL
      if (parsedUser.avatarUrl) {
        parsedUser.avatarUrl = ensureFullUrl(parsedUser.avatarUrl);
        console.log("Normalized avatar URL:", parsedUser.avatarUrl);
      }

      setUser(parsedUser);
      console.log("User loaded from localStorage with normalized URLs");

      // Fetch latest avatar if user is logged in
      if (parsedUser && parsedUser.id) {
        try {
          // Try to get the avatar first
          const avatarUrl = await imageApi.getUserAvatar(parsedUser.id);
          if (avatarUrl && avatarUrl !== parsedUser.avatarUrl) {
            console.log("Found updated avatar from API:", avatarUrl);
            parsedUser.avatarUrl = avatarUrl;

            // Update localStorage
            localStorage.setItem("userData", JSON.stringify(parsedUser));

            // Update state
            setUser({ ...parsedUser });
          }

          // Then get the bank info
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
        } catch (error) {
          console.error("Could not fetch user data:", error);
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
    try {
      if (!user) {
        return { success: false, isVerified: false };
      }

      // Sử dụng API mới để kiểm tra
      const verificationResult = await checkUserVerificationStatus();

      if (verificationResult.success) {
        // Cập nhật avatar URL nếu có
        const avatarUrl = user.avatarUrl || null;

        return {
          success: true,
          isVerified: verificationResult.verified,
          avatarUrl,
        };
      }

      return { success: false, isVerified: false };
    } catch (error) {
      console.error("Error in verification check:", error);
      return { success: false, isVerified: false };
    }
  };

  const updateUser = (userData) => {
    if (!user) return { success: false, message: "No user logged in" };

    const updatedUser = { ...user, ...userData };
    localStorage.setItem("userData", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return { success: true, user: updatedUser };
  };

  // Update user avatar
  const updateUserAvatar = async (avatarUrl) => {
    if (!user) {
      console.error("Cannot update avatar: No user logged in");
      return false;
    }

    try {
      // Import the userService here to avoid circular dependencies
      const { updateUserAvatar: updateAvatar } = await import(
        "../database/userService"
      );

      const success = await updateAvatar(user.id, avatarUrl);

      if (success) {
        // Update user state with new avatar URL
        setUser((prevUser) => ({
          ...prevUser,
          avatarUrl: avatarUrl,
        }));

        console.log("Avatar updated successfully in AuthContext");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error in updateUserAvatar:", error);
      return false;
    }
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
      return { success: false, message: "Không tìm thấy thông tin người dùng" };
    }

    try {
      // Sử dụng API để lấy mã hợp đồng duy nhất từ server
      let contractId;
      try {
        const contractIdResponse = await axios.get(
          `${API_BASE_URL}/api/contracts/generate-id`
        );
        if (
          contractIdResponse.data.success &&
          contractIdResponse.data.contractId
        ) {
          contractId = contractIdResponse.data.contractId;
        } else {
          // Fallback nếu API không hoạt động
          contractId = Math.floor(
            10000000 + Math.random() * 90000000
          ).toString();
        }
      } catch (error) {
        // Fallback nếu có lỗi khi gọi API
        console.error("Error getting contract ID from API:", error);
        contractId = Math.floor(10000000 + Math.random() * 90000000).toString();
      }

      const newContract = {
        userId: user.id,
        contractId,
        loanAmount: contractData.loanAmount,
        loanTerm: contractData.loanTerm,
        bankName: contractData.bankName,
        contractContent: contractData.contractContent,
        signatureImage: contractData.signatureImage,
      };

      // Cố gắng lưu vào API
      try {
        console.log("API_BASE_URL:", API_BASE_URL);

        // Đầu tiên, thử lưu hợp đồng với endpoint /api/contracts
        let response;
        try {
          response = await axios.post(
            `${API_BASE_URL}/api/contracts`,
            newContract
          );
          console.log("Thử lưu với /api/contracts:", response.data);
        } catch (err) {
          // Nếu thất bại, thử endpoint khác
          console.log(
            "Lỗi với /api/contracts, thử endpoint khác:",
            err.message
          );
          response = await axios.post(
            `${API_BASE_URL}/api/users/${user.id}/contracts`,
            newContract
          );
        }

        console.log("Contract saved to API:", response.data);

        if (response.data.success) {
          // Cập nhật thông tin người dùng trong state và localStorage
          const updatedUser = {
            ...user,
            hasVerifiedDocuments: true,
          };

          setUser(updatedUser);
          localStorage.setItem("userData", JSON.stringify(updatedUser));

          // Xóa cache contracts để buộc refresh lần sau khi lấy hợp đồng
          localStorage.removeItem(`userContracts_${user.id}`);

          return {
            success: true,
            message: "Hợp đồng đã được lưu thành công",
            contract: response.data.contract,
          };
        }
      } catch (error) {
        console.error("API error when saving contract:", error);

        // Nếu API không thành công, tạo thời gian hiện tại để lưu vào localStorage
        const timestamp = new Date();
        const currentDate = timestamp.toLocaleDateString("vi-VN");
        const currentTime = timestamp.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        // Lưu vào localStorage với thời gian hiện tại
        const contractWithTime = {
          ...newContract,
          createdDate: currentDate,
          createdTime: currentTime,
        };

        const existingContracts = JSON.parse(
          localStorage.getItem(`contracts_${user.id}`) || "[]"
        );
        existingContracts.push(contractWithTime);
        localStorage.setItem(
          `contracts_${user.id}`,
          JSON.stringify(existingContracts)
        );

        // Cập nhật trạng thái xác minh người dùng
        const updatedUser = {
          ...user,
          hasVerifiedDocuments: true,
        };

        setUser(updatedUser);
        localStorage.setItem("userData", JSON.stringify(updatedUser));

        console.log("Contract saved to localStorage as fallback");
        return {
          success: true,
          message: "Hợp đồng đã được lưu thành công (lưu trữ nội bộ)",
          contract: contractWithTime,
        };
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      return { success: false, message: "Đã xảy ra lỗi khi lưu hợp đồng" };
    }
  };

  const getUserContracts = async () => {
    if (!user || !user.id) {
      console.log("Không thể lấy hợp đồng: Không có người dùng đăng nhập");
      return { success: false, message: "Không có người dùng đăng nhập" };
    }

    try {
      const userId = user.id;
      console.log("Đang lấy danh sách hợp đồng cho user:", userId);

      // Xác định URL đúng - phải là URL đầy đủ
      const apiUrl = API_BASE_URL.endsWith("/")
        ? `${API_BASE_URL}api/users/${userId}/contracts`
        : `${API_BASE_URL}/api/users/${userId}/contracts`;

      console.log("API Request URL:", apiUrl);

      // Sử dụng axios với URL đầy đủ
      const response = await axios.get(apiUrl);

      if (response.data && response.data.success) {
        console.log(
          "Lấy danh sách hợp đồng thành công:",
          response.data.contracts
        );

        // Đảm bảo URL đầy đủ cho ảnh chữ ký
        if (response.data.contracts && response.data.contracts.length > 0) {
          response.data.contracts = response.data.contracts.map((contract) => {
            if (
              contract.signatureUrl &&
              !contract.signatureUrl.startsWith("http")
            ) {
              contract.signatureUrl =
                API_BASE_URL +
                (contract.signatureUrl.startsWith("/")
                  ? contract.signatureUrl
                  : `/${contract.signatureUrl}`);
            }
            return contract;
          });
        }

        // Lưu vào localStorage làm cache
        const userContractsKey = `userContracts_${userId}`;
        localStorage.setItem(
          userContractsKey,
          JSON.stringify(response.data.contracts)
        );

        return response.data;
      }

      return { success: false, message: "Lấy danh sách hợp đồng thất bại" };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách hợp đồng từ API:", error);
      console.log("Thử lấy contract với API URL khác...");

      // Thử với URL dự phòng
      try {
        const userId = user.id;
        const fallbackUrl = "https://cloneweb-uhw9.onrender.com";
        const apiUrl = `${fallbackUrl}/api/users/${userId}/contracts`;
        console.log("Fallback API URL:", apiUrl);
        const fallbackResponse = await axios.get(apiUrl);

        if (fallbackResponse.data && fallbackResponse.data.success) {
          console.log(
            "Lấy hợp đồng với fallback URL thành công:",
            fallbackResponse.data
          );

          // Đảm bảo URL đầy đủ cho ảnh chữ ký
          if (
            fallbackResponse.data.contracts &&
            fallbackResponse.data.contracts.length > 0
          ) {
            fallbackResponse.data.contracts =
              fallbackResponse.data.contracts.map((contract) => {
                if (
                  contract.signatureUrl &&
                  !contract.signatureUrl.startsWith("http")
                ) {
                  contract.signatureUrl =
                    fallbackUrl +
                    (contract.signatureUrl.startsWith("/")
                      ? contract.signatureUrl
                      : `/${contract.signatureUrl}`);
                }
                return contract;
              });
          }

          // Lưu vào localStorage làm cache
          const userContractsKey = `userContracts_${user.id}`;
          localStorage.setItem(
            userContractsKey,
            JSON.stringify(fallbackResponse.data.contracts)
          );

          return fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error("Fallback API cũng lỗi:", fallbackError);
      }

      // Fallback to localStorage
      const userContractsKey = `userContracts_${user.id}`;
      const savedContracts = localStorage.getItem(userContractsKey);

      if (savedContracts) {
        const contracts = JSON.parse(savedContracts);
        console.log("Lấy danh sách hợp đồng từ localStorage:", contracts);
        return {
          success: true,
          contracts: contracts,
        };
      }

      // Thử với localStorage khác
      const localStorageKey = `contracts_${user.id}`;
      const localContracts = localStorage.getItem(localStorageKey);

      if (localContracts) {
        const contracts = JSON.parse(localContracts);
        console.log(
          "Lấy danh sách hợp đồng từ localStorage alternate key:",
          contracts
        );
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

  const checkUserVerificationStatus = async () => {
    try {
      // If there's no user logged in, return immediately
      if (!user || !user.id) {
        console.log("No user to check verification status for");
        return { success: false, isVerified: false };
      }

      // Use a local storage flag to prevent repeated checks in the same session
      const lastCheckedTime = localStorage.getItem(
        `verification_check_time_${user.id}`
      );
      const currentTime = new Date().getTime();

      // Only check once every 5 minutes (300000 ms) unless forced
      if (lastCheckedTime && currentTime - parseInt(lastCheckedTime) < 300000) {
        console.log("Using cached verification status to prevent API spam");
        const cachedStatus = localStorage.getItem(
          `verification_status_${user.id}`
        );
        if (cachedStatus) {
          return JSON.parse(cachedStatus);
        }
      }

      console.log(`Checking verification status for user: ${user.id}`);

      // Create a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Verification check timed out")),
          5000
        );
      });

      try {
        // Race the API calls with a timeout
        const [profileRes, bankInfoRes] = await Promise.race([
          Promise.all([
            axios.get(`${API_BASE_URL}/api/users/${user.id}/profile`),
            axios.get(`${API_BASE_URL}/api/users/${user.id}/bank-info`),
          ]),
          timeoutPromise,
        ]);

        // After successful API calls, parse the results
        const hasPersonalInfo =
          profileRes.data.success &&
          profileRes.data.user?.personalInfo?.idNumber &&
          profileRes.data.user?.fullName;

        const hasBankInfo =
          bankInfoRes.data.success &&
          bankInfoRes.data.bankInfo?.accountNumber &&
          bankInfoRes.data.bankInfo?.bank;

        // Update user data with latest info
        const updatedUserData = {
          ...user,
          fullName: profileRes.data.user?.fullName || user.fullName,
          personalInfo: {
            ...(user.personalInfo || {}),
            ...(profileRes.data.user?.personalInfo || {}),
          },
          bankInfo: {
            ...(user.bankInfo || {}),
            ...(bankInfoRes.data.bankInfo || {}),
          },
        };

        // Save all the updated data to localStorage
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
        setUser(updatedUserData);

        // Save verification status and timestamp to localStorage
        const verificationStatus = {
          success: true,
          isVerified: hasPersonalInfo && hasBankInfo,
          hasPersonalInfo,
          hasBankInfo,
        };

        localStorage.setItem(
          `verification_status_${user.id}`,
          JSON.stringify(verificationStatus)
        );
        localStorage.setItem(
          `verification_check_time_${user.id}`,
          currentTime.toString()
        );

        console.log("Verification status saved:", verificationStatus);
        return verificationStatus;
      } catch (apiError) {
        console.error("Error checking verification status with API:", apiError);

        // If API fails, try to load from localStorage
        const userData = JSON.parse(localStorage.getItem("userData")) || {};

        // Check what info we have locally
        const hasPersonalInfo =
          userData.personalInfo &&
          userData.personalInfo.idNumber &&
          userData.fullName;

        const hasBankInfo =
          userData.bankInfo &&
          userData.bankInfo.accountNumber &&
          userData.bankInfo.bank;

        const verificationStatus = {
          success: true,
          isVerified: hasPersonalInfo && hasBankInfo,
          hasPersonalInfo,
          hasBankInfo,
        };

        // Save the status with current timestamp
        localStorage.setItem(
          `verification_status_${user.id}`,
          JSON.stringify(verificationStatus)
        );
        localStorage.setItem(
          `verification_check_time_${user.id}`,
          currentTime.toString()
        );

        return verificationStatus;
      }
    } catch (error) {
      console.error("Error in checkUserVerificationStatus:", error);
      return { success: false, isVerified: false };
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
    checkUserVerificationStatus,
    updateUserAvatar,
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
