import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";
import HomeScreen from "./Home/HomeScreen";

const Home = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const [user, setUser] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    // Nếu đã fetch dữ liệu rồi thì không fetch lại
    if (dataFetched) return;

    // Khởi tạo trạng thái đã fetch dữ liệu
    const checkUserSession = () => {
      try {
        // Lấy dữ liệu từ session storage
        const userDataStr = sessionStorage.getItem("user");

        if (!userDataStr) {
          console.log("No user session found, redirecting to login");
          navigate("/login");
          return false;
        }

        // Parse dữ liệu người dùng
        const userData = JSON.parse(userDataStr);
        console.log("User session found:", userData);

        // Kiểm tra dữ liệu người dùng
        if (!userData || !userData.phone) {
          console.log("Invalid user data in session, redirecting to login");
          sessionStorage.removeItem("user"); // Xóa dữ liệu không hợp lệ
          navigate("/login");
          return false;
        }

        // Lưu thông tin người dùng vào state
        setUser(userData);
        return true;
      } catch (error) {
        console.error("Error checking user session:", error);
        navigate("/login");
        return false;
      }
    };

    // Kiểm tra phiên đăng nhập trước khi tải dữ liệu
    const isUserLoggedIn = checkUserSession();

    if (isUserLoggedIn) {
      // Giả lập tải dữ liệu người dùng từ server
      const fetchUserData = async () => {
        showLoading();

        try {
          // Mô phỏng API call để lấy dữ liệu bổ sung của người dùng
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Đánh dấu đã tải dữ liệu
          setDataFetched(true);
        } catch (error) {
          console.error("Error fetching additional user data:", error);
        } finally {
          // Ẩn loading bất kể kết quả như thế nào
          hideLoading();
        }
      };

      fetchUserData();
    } else {
      // Đánh dấu đã tải dữ liệu để tránh fetch lại
      setDataFetched(true);
    }
  }, [dataFetched, showLoading, hideLoading, navigate]);

  const handleLogout = () => {
    // Hiển thị loading khi logout
    showLoading();

    // Giả lập quá trình logout (giảm thời gian đợi)
    setTimeout(() => {
      // Xóa session storage
      sessionStorage.removeItem("user");

      // Ẩn loading
      hideLoading();

      // Chuyển hướng về trang login
      navigate("/login");
    }, 500);
  };

  // Nếu chưa có dữ liệu người dùng, không hiển thị gì
  if (!user) {
    return null;
  }

  // Render trang chủ mới với thiết kế giống hình ảnh mẫu
  return <HomeScreen user={user} />;
};

export default Home;
