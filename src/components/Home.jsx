import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("user");
    // Redirect to login
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chào mừng đến với MB Bank</h1>

      {user && (
        <div>
          <p>Số điện thoại: {user.phone}</p>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 15px",
              backgroundColor: "#ff7f50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
