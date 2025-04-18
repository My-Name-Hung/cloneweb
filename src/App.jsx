import React, { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import NotFound from "./NotFound";
import Login from "./components/Auth/Login";
import SignUp from "./components/Auth/SignUp";
import Home from "./components/Home";

function App() {
  const [isMobileView, setIsMobileView] = useState(false);

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
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
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
  );
}

// Auth guard component
function RequireAuth({ children }) {
  const isAuthenticated = sessionStorage.getItem("user") !== null;

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default App;
