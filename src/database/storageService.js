/**
 * Storage Service for handling image uploads
 *
 * This service interfaces with the backend API for file storage and retrieval
 */

import axios from "axios";

// API URL from environment variable (Vite exposes env vars with VITE_ prefix)
const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Saves a base64 image to the server
 * @param {string} imageData - Base64 encoded image data
 * @param {string} userId - User identifier
 * @param {string} imageType - Type of image (frontId, backId, portrait)
 * @returns {Promise<string>} - Promise resolving to image URL/identifier
 */
export const saveImage = async (imageData, userId, imageType) => {
  try {
    // Send base64 data to the server
    const response = await axios.post(
      `${API_URL}/api/verification/upload/${imageType}`,
      {
        userId,
        imageData,
      }
    );

    console.log(`${imageType} uploaded for user ${userId}`);
    return response.data.filePath;
  } catch (error) {
    console.error(`Error uploading ${imageType}:`, error);

    // Fallback to localStorage if API fails (for demo purposes)
    const timestamp = new Date().getTime();
    localStorage.setItem(`${imageType}_${userId}`, imageData);

    return `${imageType}_${timestamp}`;
  }
};

/**
 * Retrieves an image from the server
 * @param {string} userId - User identifier
 * @param {string} imageType - Type of image (frontId, backId, portrait)
 * @returns {Promise<string|null>} - Promise resolving to image data or null if not found
 */
export const getImage = async (userId, imageType) => {
  try {
    // Get verification status which includes all images
    const response = await axios.get(
      `${API_URL}/api/verification/status/${userId}`
    );

    if (response.data.documents && response.data.documents[imageType]) {
      return `${API_URL}${response.data.documents[imageType]}`;
    }

    return null;
  } catch (error) {
    console.error(`Error retrieving ${imageType}:`, error);

    // Fallback to localStorage if API fails (for demo purposes)
    return localStorage.getItem(`${imageType}_${userId}`);
  }
};

/**
 * Checks if a user has uploaded all required verification documents
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} - Promise resolving to verification status
 */
export const checkVerificationStatus = async (userId) => {
  try {
    // Call the verification status API
    const response = await axios.get(
      `${API_URL}/api/verification/status/${userId}`
    );
    return response.data.isVerified;
  } catch (error) {
    console.error("Error checking verification status:", error);

    // Fallback to localStorage if API fails (for demo purposes)
    const frontId = localStorage.getItem(`frontId_${userId}`);
    const backId = localStorage.getItem(`backId_${userId}`);
    const portrait = localStorage.getItem(`portrait_${userId}`);

    return frontId !== null && backId !== null && portrait !== null;
  }
};

/**
 * Gets user's avatar image
 * @param {string} userId - User identifier
 * @returns {Promise<string|null>} - Promise resolving to avatar image data or null
 */
export const getUserAvatar = async (userId) => {
  try {
    // Call the user avatar API
    const response = await axios.get(`${API_URL}/api/users/${userId}/avatar`);

    if (response.data.avatarUrl) {
      return `${API_URL}${response.data.avatarUrl}`;
    }

    return null;
  } catch (error) {
    console.error("Error getting user avatar:", error);

    // Fallback to localStorage if API fails (for demo purposes)
    return (
      localStorage.getItem(`avatar_${userId}`) ||
      localStorage.getItem(`portrait_${userId}`)
    );
  }
};

export default {
  saveImage,
  getImage,
  checkVerificationStatus,
  getUserAvatar,
};
