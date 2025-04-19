import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

// Define API base URL with a fallback for development
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

// Debug logging để kiểm tra URL
console.log("API_BASE_URL used in AuthContext:", API_BASE_URL);

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
      console.log("User data from localStorage:", parsedUser);

      // Xử lý đầy đủ URL avatar
      if (parsedUser.avatarUrl) {
        // Nếu avatarUrl là đường dẫn tương đối, thêm API_BASE_URL
        if (!parsedUser.avatarUrl.startsWith("http")) {
          const normalizedPath = parsedUser.avatarUrl.startsWith("/")
            ? parsedUser.avatarUrl
            : `/${parsedUser.avatarUrl}`;
          parsedUser.avatarUrl = `${API_BASE_URL}${normalizedPath}`;
          console.log("Normalized avatar URL:", parsedUser.avatarUrl);
        }
      }

      // Xử lý cả ảnh chân dung trong personalInfo nếu có
      if (parsedUser.personalInfo && parsedUser.personalInfo.portraitImage) {
        if (!parsedUser.personalInfo.portraitImage.startsWith("http")) {
          const normalizedPath =
            parsedUser.personalInfo.portraitImage.startsWith("/")
              ? parsedUser.personalInfo.portraitImage
              : `/${parsedUser.personalInfo.portraitImage}`;
          parsedUser.personalInfo.portraitImage = `${API_BASE_URL}${normalizedPath}`;
          console.log(
            "Normalized portrait image URL:",
            parsedUser.personalInfo.portraitImage
          );
        }
      }

      setUser(parsedUser);
      console.log(
        "User loaded from localStorage with normalized URLs:",
        parsedUser
      );

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

  // Thêm hàm để cập nhật avatar
  const updateUserAvatar = (avatarUrl) => {
    if (!user) return { success: false, message: "No user logged in" };

    console.log("updateUserAvatar called with:", avatarUrl);

    // Đảm bảo avatarUrl đầy đủ
    let fullAvatarUrl = avatarUrl;
    if (avatarUrl && !avatarUrl.startsWith("http")) {
      fullAvatarUrl = `${API_BASE_URL}${
        avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`
      }`;
      console.log("Converted to full avatar URL:", fullAvatarUrl);
    }

    // Cập nhật avatar trong user object
    const updatedUser = {
      ...user,
      avatarUrl: fullAvatarUrl,
      // Lưu cả vào personalInfo nếu có
      personalInfo: {
        ...(user.personalInfo || {}),
        portraitImage: fullAvatarUrl,
      },
    };

    // Lưu vào localStorage và state
    localStorage.setItem("userData", JSON.stringify(updatedUser));
    setUser(updatedUser);

    console.log("Avatar updated successfully:", fullAvatarUrl);
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
      return { success: false, message: "Không tìm thấy thông tin người dùng" };
    }

    try {
      // Tạo ID hợp đồng duy nhất và thời gian
      const timestamp = new Date();
      const contractId = `${Math.floor(
        Math.random() * 100000000
      )}_${timestamp.getTime()}`;

      const currentDate = timestamp.toLocaleDateString("vi-VN");
      const currentTime = timestamp.toLocaleTimeString("vi-VN");

      const newContract = {
        userId: user.id,
        contractId,
        loanAmount: contractData.loanAmount,
        loanTerm: contractData.loanTerm,
        bankName: contractData.bankName,
        contractContent: contractData.contractContent,
        signatureImage: contractData.signatureImage,
        createdDate: currentDate,
        createdTime: currentTime,
        timestamp: timestamp.getTime(),
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
            hasVerifiedDocuments: true, // Đặt trạng thái xác minh thành true khi lưu hợp đồng thành công
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

        // Nếu API không thành công, lưu vào localStorage
        const existingContracts = JSON.parse(
          localStorage.getItem(`contracts_${user.id}`) || "[]"
        );
        existingContracts.push(newContract);
        localStorage.setItem(
          `contracts_${user.id}`,
          JSON.stringify(existingContracts)
        );

        // Cập nhật trạng thái xác minh người dùng
        const updatedUser = {
          ...user,
          hasVerifiedDocuments: true, // Đặt trạng thái xác minh thành true ngay cả khi lưu vào localStorage
        };

        setUser(updatedUser);
        localStorage.setItem("userData", JSON.stringify(updatedUser));

        console.log("Contract saved to localStorage as fallback");
        return {
          success: true,
          message: "Hợp đồng đã được lưu thành công (lưu trữ nội bộ)",
          contract: newContract,
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
    if (!user || !user.id) {
      return { verified: false, hasPersonalInfo: false, hasBankInfo: false };
    }

    try {
      // Thử lấy dữ liệu từ API trước
      try {
        const [profileRes, bankInfoRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/users/${user.id}/profile`),
          axios.get(`${API_BASE_URL}/api/users/${user.id}/bank-info`),
        ]);

        const hasPersonalInfo =
          profileRes.data.success &&
          profileRes.data.user?.personalInfo?.idNumber &&
          profileRes.data.user?.fullName;

        const hasBankInfo =
          bankInfoRes.data.success &&
          bankInfoRes.data.bankInfo?.accountNumber &&
          bankInfoRes.data.bankInfo?.bank;

        // Nếu đã xác minh trước đó thông qua localStorage (từ saveUserContract)
        const isAlreadyVerified = user.hasVerifiedDocuments === true;
        const verified = isAlreadyVerified || (hasPersonalInfo && hasBankInfo);

        // Cập nhật thông tin người dùng trong state và localStorage
        if (
          profileRes.data.success ||
          bankInfoRes.data.success ||
          isAlreadyVerified
        ) {
          const updatedUser = { ...user };

          if (profileRes.data.success) {
            updatedUser.fullName = profileRes.data.user.fullName;
            updatedUser.personalInfo = profileRes.data.user.personalInfo;
          }

          if (bankInfoRes.data.success) {
            updatedUser.bankInfo = bankInfoRes.data.bankInfo;
          }

          if (verified) {
            updatedUser.hasVerifiedDocuments = true;
          }

          setUser(updatedUser);
          localStorage.setItem("userData", JSON.stringify(updatedUser));
        }

        return {
          verified: verified,
          hasPersonalInfo,
          hasBankInfo,
          success: true,
        };
      } catch (apiError) {
        console.log("API error, falling back to localStorage:", apiError);

        // Nếu API thất bại, sử dụng dữ liệu từ localStorage
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");

        // Kiểm tra hasVerifiedDocuments từ localStorage
        const isVerified = userData.hasVerifiedDocuments === true;
        const hasPersonalInfoFromLocalStorage =
          userData.personalInfo &&
          userData.personalInfo.idNumber &&
          userData.fullName;
        const hasBankInfoFromLocalStorage =
          userData.bankInfo &&
          userData.bankInfo.accountNumber &&
          userData.bankInfo.bank;

        return {
          verified:
            isVerified ||
            (hasPersonalInfoFromLocalStorage && hasBankInfoFromLocalStorage),
          hasPersonalInfo: hasPersonalInfoFromLocalStorage,
          hasBankInfo: hasBankInfoFromLocalStorage,
          success: true,
        };
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      return {
        verified: false,
        hasPersonalInfo: false,
        hasBankInfo: false,
        success: false,
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
