import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Check if admin is logged in
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdmin(parsedAdmin);

        // Set authorization header for all requests
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${parsedAdmin.token}`;
      } catch (error) {
        console.error("Error parsing admin data:", error);
        localStorage.removeItem("admin");
      }
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/api/admin/login`, {
        username,
        password,
      });

      if (response.data.success) {
        const adminData = {
          ...response.data.admin,
          token: response.data.token,
        };

        // Store admin in localStorage
        localStorage.setItem("admin", JSON.stringify(adminData));

        // Set admin in state
        setAdmin(adminData);

        // Set authorization header for all requests
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${adminData.token}`;

        return { success: true };
      } else {
        setError(response.data.message || "Login failed");
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error("Admin login error:", error);
      const message = error.response?.data?.message || "Login failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear admin from localStorage
    localStorage.removeItem("admin");

    // Clear admin from state
    setAdmin(null);

    // Clear authorization header
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
