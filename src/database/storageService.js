/**
 * Storage Service for handling image uploads
 *
 * This service interfaces with the backend API for file storage and retrieval
 */

import axios from "axios";

// Constants for API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cloneweb-uhw9.onrender.com";

/**
 * Save an image to the server
 * @param {string} userId - ID of the user
 * @param {string} imageType - Type of image ('avatar', 'document')
 * @param {File|Blob|string} imageData - Image data (File, Blob or base64)
 * @param {string} documentType - Optional type for documents
 * @returns {Promise<string>} - URL where the image was saved
 */
export const saveImage = async (
  userId,
  imageType,
  imageData,
  documentType = ""
) => {
  if (!userId || !imageType || !imageData) {
    console.error("Missing required parameters for saveImage");
    return null;
  }

  try {
    console.log(`Saving ${imageType} image for user ${userId}`);

    // Prepare form data for server upload
    const formData = new FormData();

    // Handle different imageData formats
    if (typeof imageData === "string" && imageData.startsWith("data:")) {
      // For base64 data
      const blob = await (await fetch(imageData)).blob();
      formData.append("image", blob, `${imageType}_${Date.now()}.png`);
    } else if (imageData instanceof Blob || imageData instanceof File) {
      // For Blob or File
      formData.append("image", imageData, `${imageType}_${Date.now()}.png`);
    } else {
      console.error("Unsupported image data format");
      return null;
    }

    formData.append("userId", userId);
    formData.append("imageType", imageType);
    if (documentType) {
      formData.append("documentType", documentType);
    }

    // Upload to server
    console.log(
      `Uploading ${imageType} to ${API_BASE_URL}/api/verification/upload/${
        imageType === "document" ? documentType : imageType
      }`
    );

    const response = await axios.post(
      `${API_BASE_URL}/api/verification/upload/${
        imageType === "document" ? documentType : imageType
      }`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Upload response:", response.data);

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to upload image to server"
      );
    }

    // Get the URL from the server response
    const imageUrl = response.data.fileUrl || response.data.fullUrl;
    console.log("Image URL from server:", imageUrl);

    return imageUrl;
  } catch (error) {
    console.error("Error saving image:", error);
    return null;
  }
};

/**
 * Save a signature image
 * @param {string} userId - ID of the user
 * @param {string} contractId - ID of the contract
 * @param {string} signatureData - Signature data (base64)
 * @returns {Promise<string>} - URL where the signature was saved
 */
export const saveSignature = async (userId, contractId, signatureData) => {
  if (!userId || !contractId || !signatureData) {
    console.error("Missing required parameters for saveSignature");
    return null;
  }

  try {
    console.log(`Saving signature for user ${userId}, contract ${contractId}`);

    // Prepare form data
    const formData = new FormData();

    // Convert base64 to Blob
    if (
      typeof signatureData === "string" &&
      signatureData.startsWith("data:")
    ) {
      const blob = await (await fetch(signatureData)).blob();
      formData.append("signature", blob, `signature_${Date.now()}.png`);
    } else if (signatureData instanceof Blob || signatureData instanceof File) {
      formData.append(
        "signature",
        signatureData,
        `signature_${Date.now()}.png`
      );
    } else {
      console.error("Unsupported signature data format");
      return null;
    }

    formData.append("userId", userId);
    formData.append("contractId", contractId);

    // Upload to server
    const response = await axios.post(
      `${API_BASE_URL}/api/contracts/signature`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to upload signature to server"
      );
    }

    // Get the URL from the server response
    const signatureUrl = response.data.signatureUrl;
    console.log("Signature URL from server:", signatureUrl);

    return signatureUrl;
  } catch (error) {
    console.error("Error saving signature:", error);
    return null;
  }
};

/**
 * Get user avatar URL
 * @param {string} userId - ID of the user
 * @returns {Promise<string>} - URL of the avatar
 */
export const getUserAvatar = async (userId) => {
  if (!userId) {
    console.error("Missing userId for getUserAvatar");
    return null;
  }

  try {
    console.log(`Getting avatar for user ${userId}`);
    const response = await axios.get(
      `${API_BASE_URL}/api/users/${userId}/avatar`
    );

    if (response.data.success) {
      const avatarUrl = response.data.fullAvatarUrl || response.data.avatarUrl;

      // Ensure it's a full URL
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        return `${API_BASE_URL}${
          avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`
        }`;
      }

      return avatarUrl;
    }

    return null;
  } catch (error) {
    console.error("Error getting user avatar:", error);
    return null;
  }
};

/**
 * Get a signature image from the server
 * @param {string} userId - ID of the user
 * @param {string} contractId - ID of the contract
 * @returns {Promise<string>} - URL of the signature
 */
export const getSignature = async (userId, contractId) => {
  if (!userId || !contractId) {
    console.error("Missing required parameters for getSignature");
    return null;
  }

  try {
    console.log(`Getting signature for user ${userId}, contract ${contractId}`);
    const response = await axios.get(
      `${API_BASE_URL}/api/contracts/${contractId}/signature/${userId}`
    );

    if (response.data.success && response.data.signatureUrl) {
      const signatureUrl = response.data.signatureUrl;

      // Ensure it's a full URL
      if (!signatureUrl.startsWith("http")) {
        return `${API_BASE_URL}${
          signatureUrl.startsWith("/") ? signatureUrl : `/${signatureUrl}`
        }`;
      }

      return signatureUrl;
    }

    return null;
  } catch (error) {
    console.error("Error getting signature:", error);
    return null;
  }
};

export default {
  saveImage,
  getUserAvatar,
  saveSignature,
  getSignature,
};
