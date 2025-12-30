# App Overview

**FaithVoice** is a faith-based social networking application designed to provide a digital sanctuary for believers.
-   **Purpose**: To connect users through prayer, praise, verse art, and thoughts in a distraction-free, spiritual environment.
-   **Primary User Goal**: To share spiritual moments, request prayers, and engage with scripture and a like-minded community.
-   **Main Sections**:
    -   **Home Feed**: A mixed stream of thoughts, prayers, praises, and verse art.
    -   **Prayer**: A dedicated section for prayer requests and intercession.
    -   **Explore**: Discovery of content by category (Trending, Prayers, Praise, Verse Art).
    -   **Bible**: A full Bible reader with multiple versions.
    -   **Create**: A unified interface to post different types of spiritual content.
    -   **Profile**: User identity, stats, and personal post history.

---

# Screen & Route Map

## Public Routes
-   **Welcome** (`/welcome`)
    -   *Entry*: Default for unauthenticated users.
    -   *UI*: Landing page with "Join" or "Login" calls to action.
-   **Login** (`/login`)
    -   *Entry*: From Welcome.
    -   *Actions*: Email/Password login, Google Auth.
-   **Signup** (`/signup`)
    -   *Entry*: From Welcome.
    -   *Actions*: Create account, Google Auth.

## Protected Routes (Authenticated)
-   **Home** (`/`)
    -   *UI*: Top header (faith quotes/greeting), Main Feed (scrollable), Bottom Navigation.
    -   *Actions*: View posts, Like, Comment, Repost, Navigate to other tabs.
    -   *Data*: `PostService.getFeedPosts` (Firestore).
    -   *Files*: `src/pages/HomePage.tsx`, `src/components/feed/FeedPost.tsx`.

-   **Prayer** (`/prayer`)
    -   *UI*: Dedicated feed for Prayer type posts.
    -   *Actions*: "Pray" (interaction), Filter by "My Prayers" vs "Community".
    -   *Files*: `src/pages/prayer/PrayerPage.tsx`.

-   **Create** (`/create`)
    -   *Entry*: Central "Plus" button in Bottom Nav.
    -   *UI*: Full-screen creator.
    -   *Actions*: Select Type (Thought, Verse Art, Prayer, Praise), Add Media, Add Verse, Add Music, Post, Save Draft.
    -   *Files*: `src/pages/create/UnifiedCreatePostScreen.tsx`, `src/components/verse-art/VersePicker.tsx`.

-   **Explore** (`/explore`)
    -   *UI*: Grid or list of content categorized by Trending, Prayers, Praise, etc. Search bar.
    -   *Actions*: Search posts, Filter by category.
    -   *Data*: `PostService.getExplorePosts`.
    -   *Files*: `src/pages/explore/ExplorePage.tsx`.

-   **Bible** (`/bible`, `/bible/:version/:bookId/:chapter/:verse`)
    -   *UI*: Text reader, Chapter selector, Version selector (BSB, KJV, etc.).
    -   *Actions*: Read, Select Verse (for posting), Change Settings (Font/Version).
    -   *State*: `BibleContext` (local prefs).
    -   *Files*: `src/pages/BiblePage.tsx`, `src/contexts/BibleContext.tsx`.

-   **Profile** (`/profile`, `/profile/:userId`)
    -   *UI*: Avatar, Stats (Followers/Following), Bio, User's Posts (Tabs for Thoughts, Prayers, etc.).
    -   *Actions*: Edit Profile, Follow/Unfollow, View specific user posts.
    -   *Data*: `UserService`, Firestore `users`.
    -   *Files*: `src/pages/profile/ProfilePage.tsx`, `src/pages/profile/EditProfilePage.tsx`.

-   **Settings** (`/settings`)
    -   *Actions*: Account settings, Notification preferences, Debug tools (Seed script).
    -   *Files*: `src/pages/settings/SettingsPage.tsx`.

-   **Notifications** (`/notifications`)
    -   *UI*: List of interactions (likes, comments).
    -   *Files*: `src/pages/notifications/NotificationsPage.tsx`.

-   **Messages** (`/messages`)
    -   *UI*: DM threads.
    -   *Files*: `src/pages/messages/MessagesPage.tsx`, `src/pages/messages/ChatPage.tsx`.

## Admin Routes
-   **Dashboard** (`/admin`)
-   **Management**: Posts, Comments, Users, Audio (`/admin/audio`).
-   *Files*: `src/pages/admin/*`.

---

# User Flows (Step-by-Step)

## 1. Authentication
1.  User lands on **Welcome Page**.
2.  Selects **Login** or **Signup**.
3.  **Signup**: Enters Email/Pass + Name + Username -> `createUserWithEmailAndPassword` -> Profile Update -> Firestore `users` doc created.
4.  **Google**: `signInWithPopup` -> Firestore sync.
5.  Redirects to **Home**.

## 2. Create Post Flow
1.  User taps **+ (Create)** in Bottom Nav.
2.  **UnifiedCreatePostScreen** opens.
3.  User selects **Type**: Mention (Thought), Artist (Verse Art), Pray (Prayer), Praise.
4.  **Inputs**:
    -   Text Content.
    -   *Optional*: Media (Image/Video).
    -   *Optional*: Verse (via `VersePicker`).
    -   *Optional*: Audio Track (Music).
    -   *Prayer Only*: Visibility (Public/Private), Background Gradient.
5.  **Action**: User taps "Post".
6.  **Process**: `queuePost` adds to global queue (background upload).
7.  **Feedback**: Toast "Posting...", redirects to Home (or originating screen).

## 3. Feed & Interaction Flow
1.  **Home Page** loads -> `PostService.getFeedPosts` fetches recent posts.
2.  User scrolls (infinite scroll likely implementation details in `PostService` show cursor-based pagination).
3.  **Like**: Tapping Heart updates Firestore `likes` count + subcollection.
4.  **Prayer**: Tapping "Pray" updates `prayerCount`.
5.  **Refresh**: Pull-to-refresh triggers re-fetch.

---

# State & Data Handling

## Authentication & User Data
-   **AuthContext**: Wraps Firebase Auth.
-   **User Sync**: On login, user data is synced to Firestore `users/{uid}`.
-   **Persistence**: Handled by Firebase SDK.

## Global State
-   **Contexts**:
    -   `BibleContext`: Font size, family, version (persisted in `localStorage`).
    -   `AudioContext`: Global music player state (Currently using Mock Data).
    -   `ThemeContext`: Light/Dark mode.
    -   `NotificationContext`: Unread counts.
    -   `PostQueueContext`: Background post uploading.

## Data Fetching
-   **Pattern**: Service-based fetching (`PostService`, `BibleService`).
-   **Storage**: Firestore is the primary DB.
-   **Caching**: Not explicitly visible in custom logic, relying on Firebase SDK caching/offline support.

## Backend & Integrations
-   **Firebase Auth**: Email/Password, Google, Anonymous.
-   **Firestore**:
    -   `posts`: Main content.
    -   `users`: Profiles and stats.
    -   `notifications`: User alerts.
-   **Storage**: implied usage for Media/Avatars.
-   **Search**: Client-side fallback logic exists in `PostService.searchPosts` if Firestore indices are missing.

---

# UI & Design System

-   **Framework**: React + Tailwind CSS.
-   **Theme**:
    -   **Colors**: Custom `cream` (backgrounds), `gold` (accents), `navy` (text/dark mode).
    -   **Fonts**: Serif (`Merriweather`, `Crimson Text`) & Sans (`Inter`).
-   **Components**:
    -   Atomic usage of Tailwind classes.
    -   Some shared UI in `src/components/ui` (`AppLogo`, `Avatar`, `SacredLoader`).
    -   Icons: `lucide-react`.
-   **Design Philosophy**: "Digital Sanctuary" - clean, warm, minimizing distractions.

---

# Visual Walkthrough (Text-Only)

## Home Screen
-   **Header**: "FaithVoice" in Gold Serif font. Icons for Search, Music. Hidden on scroll down.
-   **Feed**: Vertical list of Cards.
    -   **Cards**: White/Navy-Light background. Header with Avatar + Name + Time. Content (Text/Image). Footer with interaction icons (Like, Comment, Share).
-   **Bottom Nav**: Fixed at bottom. Icons: Home, Explore, **Create (+) Main Action**, Bible, Profile.

## Create Screen
-   **Layout**: Full screen modal.
-   **Top Bar**: "New Post", Save Draft icon.
-   **Type Selector**: Horizontal scroll of pills (Thought, Verse Art, Prayer, Praise).
-   **Main Area**: Large Text Area. Media preview if selected. Verse/Music previews as inset cards.
-   **Bottom Controls**: Media, Camera, Music, Book icons. Large "POST" button with gradient.

---

# Known Issues Observed in Code

1.  **Search Fallback**: `PostService.ts` contains fallback logic for missing Firestore indices (`failed-precondition`), implying indices might not be fully deployed.
2.  **Incomplete Features**: `MusicService.ts` relies on mock data and is not fully implemented (Confirmed by user).
3.  **Seeding Scripts**: `App.tsx` contains commented-out seeding scripts. (Note: Database is currently fully seeded).
4.  **Refactoring Artifacts**: `UnifiedCreatePostScreen` mentions "legacy compatibility" for aspect ratios.

---

# Quick Wins (No Code Changes)

1.  **Empty States**: `HomePage` has a basic "No posts found" message. Could be more guiding.
2.  **Console Logs**: `PostService` logs "Fetched posts:" count to console; could be removed for production cleanup.
3.  **Magic Numbers**: Scroll thresholds in `HomePage` (100px) are hardcoded.
4.  **Type Safety**: `PostService` uses `as Post` assertions; could be safer with Zod or runtime validation.
