/**
 * Storage Service for handling image uploads
 *
 * This service interfaces with the backend API for file storage and retrieval
 * with local storage backup in /database/uploads
 */

import axios from "axios";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";

// Constants for API and storage paths
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LOCAL_AVATAR_PATH = "/database/uploads/avatars";
const LOCAL_DOCUMENTS_PATH = "/database/uploads/documents";
const LOCAL_SIGNATURES_PATH = "/database/uploads/signatures";

// Local storage keys
const STORAGE_KEYS = {
  IMAGES: "localImages",
  SIGNATURES: "localSignatures",
  AVATARS: "localAvatars",
};

/**
 * Save a file to local storage from URL or base64
 * @param {string} url - URL or base64 string of the file
 * @param {string} fileName - Name to save the file as
 * @param {string} localPath - Local path to save the file to
 * @returns {Promise<string>} - Local path where the file was saved
 */
const saveFileToLocal = async (url, fileName, localPath) => {
  try {
    console.log(`Saving file ${fileName} to ${localPath}`);

    // Create full path
    const fullPath = `${localPath}/${fileName}`;

    // Handle base64 data
    if (url.startsWith("data:")) {
      // Convert base64 to blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Save blob to file
      saveAs(blob, fullPath);
      return fullPath;
    }

    // Handle http/https URLs
    if (url.startsWith("http")) {
      try {
        const response = await axios.get(url, { responseType: "blob" });
        saveAs(response.data, fullPath);
        return fullPath;
      } catch (error) {
        console.error(`Error downloading file from URL: ${url}`, error);
        throw error;
      }
    }

    console.error(`Unsupported URL format: ${url}`);
    return null;
  } catch (error) {
    console.error(`Error saving file to local: ${error.message}`);
    return null;
  }
};

/**
 * Check if a file exists in local storage
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} - Whether the file exists
 */
const checkFileExists = async (filePath) => {
  // First check in IndexedDB
  try {
    // Get local storage data
    const localImagesString = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (localImagesString) {
      const localImages = JSON.parse(localImagesString);
      if (localImages.includes(filePath)) {
        return true;
      }
    }

    // Similar for signatures
    const localSignaturesString = localStorage.getItem(STORAGE_KEYS.SIGNATURES);
    if (localSignaturesString) {
      const localSignatures = JSON.parse(localSignaturesString);
      if (localSignatures.includes(filePath)) {
        return true;
      }
    }

    // And avatars
    const localAvatarsString = localStorage.getItem(STORAGE_KEYS.AVATARS);
    if (localAvatarsString) {
      const localAvatars = JSON.parse(localAvatarsString);
      if (localAvatars.includes(filePath)) {
        return true;
      }
    }

    // If not found in localStorage tracking, try fetch
    try {
      const response = await fetch(filePath);
      return response.ok;
    } catch (error) {
      console.log(`File ${filePath} not found locally: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking if file exists: ${error.message}`);
    return false;
  }
};

/**
 * Save an image both to server and local storage
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
    // Create a unique filename
    const fileExtension = "png";
    const uniqueId = uuidv4().replace(/-/g, "");
    const timestamp = Date.now();
    const fileName = `${imageType}_${userId}_${uniqueId}_${timestamp}.${fileExtension}`;

    // Determine local path based on image type
    let localPath;
    if (imageType === "avatar") {
      localPath = LOCAL_AVATAR_PATH;
    } else if (imageType === "document") {
      localPath = `${LOCAL_DOCUMENTS_PATH}/${documentType || ""}`;
    } else {
      console.error(`Unknown image type: ${imageType}`);
      return null;
    }

    // Prepare form data for server upload
    const formData = new FormData();

    // Handle different imageData formats
    if (typeof imageData === "string" && imageData.startsWith("data:")) {
      // For base64 data
      const blob = await (await fetch(imageData)).blob();
      formData.append("image", blob, fileName);
    } else if (imageData instanceof Blob || imageData instanceof File) {
      // For Blob or File
      formData.append("image", imageData, fileName);
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

    try {
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

      // Save locally and track in local storage
      await saveFileToLocal(imageUrl, fileName, localPath);

      // Update local storage tracking
      const localPath_DB = `${localPath}/${fileName}`;
      if (imageType === "avatar") {
        const avatars = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.AVATARS) || "[]"
        );
        if (!avatars.includes(localPath_DB)) {
          avatars.push(localPath_DB);
          localStorage.setItem(STORAGE_KEYS.AVATARS, JSON.stringify(avatars));
        }
      } else {
        const images = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.IMAGES) || "[]"
        );
        if (!images.includes(localPath_DB)) {
          images.push(localPath_DB);
          localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
        }
      }

      return imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
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
    // Create a unique filename
    const fileExtension = "png";
    const timestamp = Date.now();
    const fileName = `signature_${userId}_${contractId}_${timestamp}.${fileExtension}`;

    // Prepare form data
    const formData = new FormData();

    // Convert base64 to Blob
    if (
      typeof signatureData === "string" &&
      signatureData.startsWith("data:")
    ) {
      const blob = await (await fetch(signatureData)).blob();
      formData.append("signature", blob, fileName);
    } else if (signatureData instanceof Blob || signatureData instanceof File) {
      formData.append("signature", signatureData, fileName);
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

    // Save locally
    const localPath = LOCAL_SIGNATURES_PATH;
    await saveFileToLocal(signatureUrl, fileName, localPath);

    // Update local storage tracking
    const localPath_DB = `${localPath}/${fileName}`;
    const signatures = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SIGNATURES) || "[]"
    );
    if (!signatures.includes(localPath_DB)) {
      signatures.push(localPath_DB);
      localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(signatures));
    }

    return signatureUrl;
  } catch (error) {
    console.error("Error saving signature:", error);
    return null;
  }
};

/**
 * Get an image from local storage or server
 * @param {string} userId - ID of the user
 * @param {string} imageType - Type of image ('avatar', 'document')
 * @param {string} documentType - Optional type for documents
 * @returns {Promise<string>} - URL of the image
 */
export const getImage = async (userId, imageType, documentType = "") => {
  if (!userId || !imageType) {
    console.error("Missing required parameters for getImage");
    return null;
  }

  try {
    // Check if we have it in local storage tracking
    if (imageType === "avatar") {
      const avatars = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.AVATARS) || "[]"
      );
      const userAvatarPattern = `${LOCAL_AVATAR_PATH}/avatar_${userId}_`;

      const matchingAvatar = avatars.find((path) =>
        path.includes(userAvatarPattern)
      );
      if (matchingAvatar && (await checkFileExists(matchingAvatar))) {
        return matchingAvatar;
      }
    } else if (imageType === "document") {
      const images = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.IMAGES) || "[]"
      );
      const docPattern = `${LOCAL_DOCUMENTS_PATH}/${
        documentType || ""
      }/document_${userId}_`;

      const matchingDoc = images.find((path) => path.includes(docPattern));
      if (matchingDoc && (await checkFileExists(matchingDoc))) {
        return matchingDoc;
      }
    }

    // If not found locally, fetch from server
    const endpoint =
      imageType === "avatar"
        ? `/api/users/${userId}/avatar`
        : `/api/users/${userId}/document${
            documentType ? `/${documentType}` : ""
          }`;

    const response = await axios.get(`${API_BASE_URL}${endpoint}`);

    if (response.data.success && response.data.imageUrl) {
      // Save it locally for future use
      const imageUrl = response.data.imageUrl;
      const fileNameParts = imageUrl.split("/");
      const fileName = fileNameParts[fileNameParts.length - 1];

      const localPath =
        imageType === "avatar"
          ? LOCAL_AVATAR_PATH
          : `${LOCAL_DOCUMENTS_PATH}/${documentType || ""}`;

      const localUrl = await saveFileToLocal(imageUrl, fileName, localPath);

      // Update local storage tracking
      if (imageType === "avatar") {
        const avatars = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.AVATARS) || "[]"
        );
        if (!avatars.includes(localUrl)) {
          avatars.push(localUrl);
          localStorage.setItem(STORAGE_KEYS.AVATARS, JSON.stringify(avatars));
        }
      } else {
        const images = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.IMAGES) || "[]"
        );
        if (!images.includes(localUrl)) {
          images.push(localUrl);
          localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
        }
      }

      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error(`Error getting ${imageType}:`, error);
    return null;
  }
};

/**
 * Get a signature image from local storage or server
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
    // Check if we have it in local storage tracking
    const signatures = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SIGNATURES) || "[]"
    );
    const signaturePattern = `${LOCAL_SIGNATURES_PATH}/signature_${userId}_${contractId}_`;

    const matchingSignature = signatures.find((path) =>
      path.includes(signaturePattern)
    );
    if (matchingSignature && (await checkFileExists(matchingSignature))) {
      return matchingSignature;
    }

    // If not found locally, fetch from server
    const response = await axios.get(
      `${API_BASE_URL}/api/contracts/${contractId}/signature/${userId}`
    );

    if (response.data.success && response.data.signatureUrl) {
      // Save it locally for future use
      const signatureUrl = response.data.signatureUrl;
      const fileNameParts = signatureUrl.split("/");
      const fileName = fileNameParts[fileNameParts.length - 1];

      const localUrl = await saveFileToLocal(
        signatureUrl,
        fileName,
        LOCAL_SIGNATURES_PATH
      );

      // Update local storage tracking
      if (localUrl) {
        const signatures = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.SIGNATURES) || "[]"
        );
        if (!signatures.includes(localUrl)) {
          signatures.push(localUrl);
          localStorage.setItem(
            STORAGE_KEYS.SIGNATURES,
            JSON.stringify(signatures)
          );
        }
      }

      return signatureUrl;
    }

    return null;
  } catch (error) {
    console.error("Error getting signature:", error);
    return null;
  }
};

/**
 * Get user avatar
 * @param {string} userId - ID of the user
 * @returns {Promise<string>} - URL of the avatar
 */
export const getUserAvatar = async (userId) => {
  return getImage(userId, "avatar");
};

/**
 * Sync all images for a user from server to local storage
 * @param {string} userId - ID of the user
 * @returns {Promise<boolean>} - Whether the sync was successful
 */
export const syncUserImagesToLocal = async (userId) => {
  if (!userId) {
    console.error("Missing userId for syncUserImagesToLocal");
    return false;
  }

  try {
    console.log(`Syncing images for user ${userId} to local storage`);

    // 1. Get the avatar
    await getUserAvatar(userId);

    // 2. Get documents
    const docTypes = ["id_front", "id_back", "bank_card"];
    for (const docType of docTypes) {
      await getImage(userId, "document", docType);
    }

    // 3. Get contracts and their signatures
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${userId}/contracts`
      );
      if (response.data.success && Array.isArray(response.data.contracts)) {
        for (const contract of response.data.contracts) {
          if (contract._id) {
            // Get signature for each contract
            await getSignature(userId, contract._id);
          }
        }
      }
    } catch (error) {
      console.error("Error syncing user contracts and signatures:", error);
    }

    console.log(`Completed syncing images for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error syncing user images to local:", error);
    return false;
  }
};

export default {
  saveImage,
  getImage,
  getUserAvatar,
  saveSignature,
  getSignature,
  syncUserImagesToLocal,
};
