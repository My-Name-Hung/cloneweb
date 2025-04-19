import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import HomeScreen from "./Home/HomeScreen";

const Home = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { user, checkAuth } = useAuth();
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    // If data is already fetched, don't fetch again
    if (dataFetched) return;

    // Check user session
    const loadUserData = async () => {
      showLoading();

      try {
        // Check if we have a user in context
        if (!user) {
          console.log(
            "No user in context, checking localStorage and auth status"
          );
          await checkAuth();
        }

        // Simulate loading additional user data
        await new Promise((resolve) => setTimeout(resolve, 500));
        setDataFetched(true);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        hideLoading();
      }
    };

    loadUserData();
  }, [dataFetched, user, checkAuth, showLoading, hideLoading]);

  // If data is fetched but still no user, we need to redirect to login
  useEffect(() => {
    if (dataFetched && !user) {
      console.log(
        "Data fetched but no authenticated user found, redirecting to login"
      );
      navigate("/login");
    }
  }, [dataFetched, user, navigate]);

  // If still loading data, show nothing
  if (!dataFetched) {
    return null;
  }

  // If no user after data fetch, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  // Render the home screen with user data
  return <HomeScreen user={user} />;
};

export default Home;
