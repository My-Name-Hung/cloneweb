import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import "../styles/AdminLayout.css";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const overlayRef = useRef(null);

  // Track screen size changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Automatically expand sidebar in desktop mode
      if (!mobile && !sidebarExpanded) {
        setSidebarExpanded(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarExpanded]);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Close sidebar when clicking overlay
  const handleOverlayClick = () => {
    if (isMobile && sidebarExpanded) {
      setSidebarExpanded(false);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar
        isOpen={sidebarExpanded}
        closeSidebar={() => setSidebarExpanded(false)}
      />
      <Header toggleSidebar={toggleSidebar} />
      <div
        ref={overlayRef}
        className={`sidebar-overlay ${sidebarExpanded ? "active" : ""}`}
        onClick={handleOverlayClick}
      ></div>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
