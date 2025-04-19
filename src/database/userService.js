/**
 * User Service for managing user profiles
 *
 * In a real application, this would interface with a backend API
 * For this demo, we're simulating with localStorage
 */

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
 * @param {string} avatarUrl - URL of the new avatar image
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    // First, update the user data in memory
    const user = await getUserProfile(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return false;
    }

    // Update avatar URL
    user.avatarUrl = avatarUrl;

    // Update in localStorage to ensure consistency across app
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedUserData = JSON.parse(userData);

      // Only update if this is the current logged-in user
      if (parsedUserData.id === userId) {
        parsedUserData.avatarUrl = avatarUrl;
        localStorage.setItem("userData", JSON.stringify(parsedUserData));
        console.log("Updated avatar in localStorage:", avatarUrl);
      }
    }

    // Save to server (if we had an endpoint for this)
    // This is a placeholder for actual API implementation
    try {
      // Simulate API call to update user avatar
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Return success
      return true;
    } catch (error) {
      console.error("Error updating avatar on server:", error);
      return false;
    }
  } catch (error) {
    console.error("Error updating avatar:", error);
    return false;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
};
