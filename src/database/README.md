# Image Upload Storage

This directory contains files related to storage services for user uploads in the application.

## Directory Structure

```
src/database/
├── storageService.js # Service for saving and retrieving images
├── userService.js    # Service for managing user profiles with avatars
└── README.md         # This documentation file
```

## Implementation Details

### Storage Service

The `storageService.js` file provides functionality for:

- Saving uploaded images (ID documents and portraits)
- Retrieving saved images
- Checking a user's verification status
- Getting a user's avatar image

The service now connects to a backend API for permanent storage of images, with localStorage as a fallback mechanism for offline or demo purposes.

### User Service

The `userService.js` file manages user profiles, including:

- Getting and updating user profile data
- Setting the user's avatar using the portrait image from verification
- Persisting user data across sessions

### Backend Integration

The application uses a Node.js/Express backend with MongoDB for data storage:

- Images are physically stored on the server in the `/uploads` directory
- MongoDB stores references to these files in the database
- The backend automatically processes portrait images as avatars
- Verification status is tracked in the user record

### File Storage Structure

On the backend, uploaded files are stored in the following structure:

```
uploads/
├── avatars/      # Portrait images (used as profile pictures)
└── documents/    # ID documents (front and back of ID cards)
```

### Using the Portrait Image as Avatar

During the KYC verification process, when a user uploads their portrait photo:

1. The image is saved to the server in the `uploads/avatars` directory
2. A reference to this file is stored in the database
3. The user's profile is updated to use this image as their avatar
4. The avatar is made available throughout the application

## Usage Examples

```javascript
// Save an image
await saveImage(imageData, userId, "portrait");

// Check if a user has verified their identity
const isVerified = await checkVerificationStatus(userId);

// Get a user's avatar
const avatarImage = await getUserAvatar(userId);

// Update a user's avatar from their verification portrait
await updateUserAvatar(userId);
```
