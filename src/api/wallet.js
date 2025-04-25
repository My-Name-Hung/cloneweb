import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Lấy số dư hiện tại
export const getBalance = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/wallet/balance`);
    return response.data;
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
};

// Cập nhật số dư khi khoản vay được phê duyệt
export const updateBalance = async (amount) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/wallet/update-balance`,
      {
        amount,
        type: "LOAN_APPROVED",
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating balance:", error);
    throw error;
  }
};

// Lấy lịch sử giao dịch
export const getTransactionHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/wallet/transactions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error;
  }
};
