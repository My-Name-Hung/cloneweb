/**
 * User Service for managing user profiles
 *
 * In a real application, this would interface with a backend API
 * For this demo, we're simulating with localStorage
 */
import { getUserAvatar } from "./storageService";

// Simulated user database
const userDatabase = {};

/**
 * Get user profile data
 * @param {string} userId - User identifier
 * @returns {Promise<Object|null>} - Promise resolving to user data or null
 */
export const getUserProfile = async (userId) => {
  return new Promise(async (resolve) => {
    // First check in memory
    if (userDatabase[userId]) {
      resolve(userDatabase[userId]);
      return;
    }

    // Check localStorage
    const storedUserData = localStorage.getItem(`user_${userId}`);
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        userDatabase[userId] = userData; // Cache in memory
        resolve(userData);
        return;
      } catch (error) {
        console.error("Error parsing stored user data:", error);
      }
    }

    // If we reach here, no user data found
    resolve(null);
  });
};

/**
 * Creates or updates a user profile
 * @param {string} userId - User identifier
 * @param {Object} userData - User profile data
 * @returns {Promise<Object>} - Promise resolving to updated user data
 */
export const updateUserProfile = async (userId, userData) => {
  return new Promise(async (resolve) => {
    // Get existing data if any
    const existingData = (await getUserProfile(userId)) || {};

    // Merge with new data
    const updatedData = {
      ...existingData,
      ...userData,
      updatedAt: new Date().getTime(),
    };

    // Store in memory
    userDatabase[userId] = updatedData;

    // Store in localStorage for persistence
    localStorage.setItem(`user_${userId}`, JSON.stringify(updatedData));

    console.log(`User profile updated for ${userId}`);
    resolve(updatedData);
  });
};

/**
 * Updates a user's avatar with the portrait image from verification
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const updateUserAvatar = async (userId) => {
  try {
    // Get the portrait image from storage
    const portraitImage = await getUserAvatar(userId);

    if (!portraitImage) {
      console.error("No portrait image found for user");
      return false;
    }

    // Update user profile with the avatar
    await updateUserProfile(userId, {
      avatar: portraitImage,
      hasVerifiedAvatar: true,
    });

    console.log(`Avatar updated for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error updating user avatar:", error);
    return false;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
};
