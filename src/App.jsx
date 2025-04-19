import React, { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import NotFound from "./NotFound";
import Login from "./components/Auth/Login";
import RequireAuth from "./components/Auth/RequireAuth";
import SignUp from "./components/Auth/SignUp";
import Home from "./components/Home";
import LoanScreen from "./components/Loan/LoanScreen";
import NotificationScreen from "./components/Notification/NotificationScreen";
import BankInfoForm from "./components/Verification/BankInfoForm";
import PersonalInfoForm from "./components/Verification/PersonalInfoForm";
import VerificationScreen from "./components/Verification/VerificationScreen";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";

// Debug/test component for auth troubleshooting
const AuthDebug = () => {
  const [storageUser, setStorageUser] = useState(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      setStorageUser(userData ? JSON.parse(userData) : null);
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
  }, []);

  const handleClearStorage = () => {
    localStorage.removeItem("user");
    setStorageUser(null);
    alert("User storage cleared!");
  };

  const handleForceLogin = () => {
    const mockUser = {
      phone: "1234567890",
      id: `debug_${Date.now()}`,
      hasVerifiedDocuments: false,
    };
    localStorage.setItem("user", JSON.stringify(mockUser));
    setStorageUser(mockUser);
    alert("Mock user created!");
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Auth Debug Tools</h1>
      <hr />
      <h2>Current User:</h2>
      <pre
        style={{
          backgroundColor: "#f5f5f5",
          padding: "10px",
          borderRadius: "5px",
          overflow: "auto",
        }}
      >
        {storageUser ? JSON.stringify(storageUser, null, 2) : "No user found"}
      </pre>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={handleClearStorage}
          style={{
            padding: "10px",
            backgroundColor: "#ff6b6b",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Clear User Storage
        </button>
        <button
          onClick={handleForceLogin}
          style={{
            padding: "10px",
            backgroundColor: "#4dabf7",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Create Mock User
        </button>
        <button
          onClick={handleGoHome}
          style={{
            padding: "10px",
            backgroundColor: "#40c057",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Go To Home
        </button>
      </div>
    </div>
  );
};

function App() {
  const [isMobileView, setIsMobileView] = useState(false);

  // Log localStorage on mount for debugging
  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      console.log(
        "App.jsx - localStorage user on start:",
        user ? JSON.parse(user) : null
      );
    } catch (e) {
      console.error("Error parsing user:", e);
    }
  }, []);

  useEffect(() => {
    // Function to check if device is mobile based on user agent and viewport width
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      const isMobileViewport = window.innerWidth <= 1028; // Common breakpoint for mobile devices

      // In dev environment, allow content to display on mobile viewport sizes even on desktop
      setIsMobileView(isMobileUserAgent || isMobileViewport);
    };

    // Initial check
    checkDevice();

    // Add resize listener
    window.addEventListener("resize", checkDevice);

    // Cleanup
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // If not mobile view, show the 404 page
  if (!isMobileView) {
    return <NotFound />;
  }

  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/notifications" element={<NotificationScreen />} />
            <Route path="/debug" element={<AuthDebug />} />
            <Route
              path="/loan"
              element={
                <RequireAuth>
                  <LoanScreen />
                </RequireAuth>
              }
            />
            <Route
              path="/verification"
              element={
                <RequireAuth>
                  <VerificationScreen />
                </RequireAuth>
              }
            />
            <Route
              path="/personal-info"
              element={
                <RequireAuth>
                  <PersonalInfoForm />
                </RequireAuth>
              }
            />
            <Route
              path="/bank-info"
              element={
                <RequireAuth>
                  <BankInfoForm />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;
