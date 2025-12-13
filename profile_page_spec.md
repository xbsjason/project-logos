# Profile Page Specification

**Version**: 1.0
**Last Updated**: 2025-12-13

## 1. Overview
The Profile Page serves as the central hub for user identity and content. It displays the user's information, statistics, and a tabbed feed of their posts.

## 2. Core Components

### 2.1 Profile Header
-   **Avatar**:
    -   **Source**: Must use `profileData.photoURL`.
    -   **Default State**: If `photoURL` is missing/null, display a "Default Avatar" consisting of:
        -   Gradient background (Gold/Navy theme).
        -   User's first initial (Capitalized).
    -   **Styling**: Rounded full, border, shadow.
    -   **Level Badge**: Absolute positioned badge on the avatar (e.g., "LVL 12").
-   **User Info**: Display Name, Username (@handle), Bio, Website link.
-   **Stats**: Following, Followers, Devotionals counts.
-   **Actions**:
    -   **Current User**: "Edit Profile" (Pencil icon), Settings (Gear icon).
    -   **Other User**: "Follow/Unfollow", "Message".

### 2.2 Content Tabs
-   **Tabs**: Grid (All), Prayer, Verse Art, Worship, Testimony, Praise.
-   **Empty States**: Specific messages for empty tabs.

## 3. Image Handling & Caching Strategy (CRITICAL)

### 3.1 Filename Strategy
To prevent browser caching issues where users see old profile photos:
-   **Filename Format**: `profile_photos/${userId}_${timestamp}`
-   **Timestamp**: `Date.now()` at the time of upload.
-   **Effect**: Every upload generates a **unique URL**, forcing the browser to fetch the new image essentially "instantly" without stale cache.

### 3.2 Cleanup Logic
-   **Before Upload**: The application MUST attempting to delete the *previous* profile image from Firebase Storage if it exists.
-   **Method**: `deleteObject` on the old `photoURL` reference.
-   **Safety**: Wrap deletion in try/catch to ensure upload proceeds even if deletion fails (e.g., if the old image was external).

### 3.3 Edit Profile Preview
-   **Immediate Feedback**: The `EditProfilePage` MUST use a local preview state (`URL.createObjectURL(file)`) to display the selected image *immediately* upon file selection.
-   **Source Priority**: `previewUrl` (Local) > `firestorePhotoUrl` (DB) > `user.photoURL` (Auth/Cache) > Default Placeholder.

## 4. Data Sync & Real-Time Updates

### 4.1 Real-Time Listeners
-   **Profile Page**: MUST use `onSnapshot` to listen to the user document.
-   **Purpose**: Ensures that edits made in `EditProfilePage` (or elsewhere) are reflected **instantly** on the `ProfilePage` without a page refresh.
-   **Edit Profile Page**: MUST use `onSnapshot` to fetch the initial data to ensure it displays the most up-to-date image even if the Auth Context is slightly stale.

## 5. Regression Tests
When modifying this page, ensure:
1.  **Default Avatar**: Appears correctly for users without photos.
2.  **Upload**: Uploading a photo updates the view *instantly* (no refresh needed).
3.  **Persistence**: Navigating away and back shows the correct new photo.
4.  **Edit Flow**: Going to Edit Profile -> Changing Photo -> Saving -> Returning -> Verifies new photo is visible.
