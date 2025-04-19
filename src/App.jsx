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
import VerificationScreen from "./components/Verification/VerificationScreen";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";

// Debug component to test authentication
const AuthTest = () => {
  const storageUser = localStorage.getItem("user");
  return (
    <div style={{ padding: "20px" }}>
      <h1>Auth Test</h1>
      <p>Local Storage User: {storageUser ? "Found" : "Not Found"}</p>
      <pre>
        {storageUser
          ? JSON.stringify(JSON.parse(storageUser), null, 2)
          : "No user data"}
      </pre>
      <button onClick={() => (window.location.href = "/")}>Go Home</button>
    </div>
  );
};

function App() {
  const [isMobileView, setIsMobileView] = useState(false);

  // Add logging to check localStorage on app start
  useEffect(() => {
    const user = localStorage.getItem("user");
    console.log("App.jsx - localStorage user on start:", user);
  }, []);

  useEffect(() => {
    // Function to check if device is mobile based on user agent and viewport width
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      const isMobileViewport = window.innerWidth <= 1020; // Common breakpoint for mobile devices

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
            <Route path="/auth-test" element={<AuthTest />} />
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
