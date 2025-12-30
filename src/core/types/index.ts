export type PostType = 'thought' | 'verse_art' | 'prayer' | 'praise';

// Legacy types for backward compatibility with existing posts in DB
export type LegacyPostType = 'video' | 'image' | 'text' | 'worship' | 'testimony';

export interface FeaturedConfig {
    isActive: boolean;
    activatedAt?: string; // ISO string
    endsAt?: string; // ISO string for fixed end date
    durationHours?: number; // Timespan in hours
    interactionLimit?: {
        type: 'likes' | 'comments' | 'shares' | 'prays' | 'amens';
        count: number;
    };
    allowDismiss: boolean;
    showOnce: boolean; // "Pinned/Featured" behavior - show once per user
    viewedBy?: Record<string, boolean>; // Map of user IDs who have viewed (if showOnce)
    dismissedBy?: Record<string, boolean>; // Map of user IDs who have dismissed
}

export interface Post {
    id: string;
    authorId: string; // Added for querying
    author: {
        name: string;
        avatar: string;
        username?: string;
    };
    type: PostType | LegacyPostType;
    content: string; // URL for media or text content
    mediaUrl?: string; // For image/video content separate from text
    tags?: string[]; // Added tags for search
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    repostCount?: number;
    createdAt: any; // Using any for Timestamp compatibility
    song?: {
        title: string;
        artist: string;
        coverUrl?: string; // Artwork
        audioUrl?: string; // Actual audio source
    };
    verse?: {
        ref: string;
        text: string;
    };
    // Prayer fields
    prayerCount?: number;
    answered?: boolean;
    answeredAt?: any; // Timestamp when marked as answered
    answeredMessage?: string; // Optional testimony/message when marked answered
    // Praise fields
    amenCount?: number;
    amenBy?: Record<string, boolean>; // Map of user IDs who said amen

    // Featured Post Config
    featuredConfig?: FeaturedConfig;

    // Repost Data
    repostData?: RepostData;

    // Prayer Rework Fields
    background?: string; // Gradient ID or CSS value
    visibility?: 'public' | 'private';

    // Media Metadata
    aspectRatio?: string; // "1:1" | "16:9" | "9:16" | "4:5"
    mediaMetadata?: {
        width?: number;
        height?: number;
    };

    // Mentions and Hashtags
    mentionUids?: string[]; // Array of mentioned user UIDs
    hashtags?: string[]; // Array of lowercase hashtags
    // Shared Moment
    sharedMoment?: {
        momentId: string;
        title: string;
        verseQuote: string;
        verseRef: string;
    };
}

export interface RepostData {
    originalPostId: string;
    originalAuthorId: string;
    originalAuthorName: string;
    originalAuthorAvatar?: string;
    originalCreatedAt: string; // ISO string
}

export interface PrayerRequest {
    id: string;
    author: {
        name: string;
        avatar: string;
    };
    content: string;
    prayerCount: number;
    isAnswered: boolean;
    timestamp: string;
    category: 'Request' | 'Praise';
}

// Comment interface for threaded comments system
export interface Comment {
    id: string;
    parentId: string | null; // null for root comment, comment ID for replies
    text: string;
    userId: string;
    username: string; // Denormalized for performance
    userAvatar: string; // Denormalized for performance
    createdAt: any; // Timestamp
    likeCount: number;
    replyCount: number;
    likedBy?: string[]; // Array of user IDs for optimistic updates

    // Enhancement fields
    isDeleted?: boolean;
    isEdited?: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'gif';
    reports?: string[]; // Array of user IDs who reported

    // Mentions and Hashtags
    mentionUids?: string[]; // Array of mentioned user UIDs
    hashtags?: string[]; // Array of lowercase hashtags
}

// Mention notification interface
export interface MentionNotification {
    id: string;
    type: 'post' | 'comment';
    postId: string;
    commentId?: string;
    fromUid: string;
    fromUsername: string;
    fromDisplayName: string;
    fromAvatar: string;
    text: string; // Preview of the post/comment (first 100 chars)
    createdAt: any; // Timestamp
    read: boolean;
}
