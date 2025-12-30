import { Timestamp } from 'firebase/firestore';

export type MomentCategory =
    | 'peace'
    | 'prayer'
    | 'gratitude'
    | 'rest'
    | 'strength'
    | 'bible'
    | 'hope'
    | 'wisdom';

export type MomentIntent =
    | 'morning'
    | 'midday'
    | 'evening'
    | 'night'
    | 'anxiety'
    | 'joy'
    | 'grief'
    | 'new_user'
    | 'encouragement';

export interface VerseReference {
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number | null;
    version?: string; // e.g. 'NIV', 'ESV'
}

export type MomentStatus = 'draft' | 'published' | 'archived';

export interface Moment {
    id?: string;
    title: string;
    message: string;
    verseQuote: string;
    verseReference: VerseReference;
    category: MomentCategory;
    intents: MomentIntent[];
    tags: string[];
    status: MomentStatus;

    // Metadata
    createdBy: string;
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
    publishedAt?: Timestamp | Date;

    // Feature scheduling
    featureUntil?: Timestamp | Date;

    // Admin generation info
    generationJobId?: string;

    // Stats (denormalized for quick access if needed, or just rely on aggregation)
    likes?: number;
    saves?: number;
    shares?: number;
}

export interface UserMomentHistory {
    uid: string;
    savedMomentIds: string[];
    recentlySeenMomentIds: string[]; // To avoid repetition in Explore
    lastSeenAt?: Timestamp | Date;
}

export interface VerseUsage {
    id: string; // e.g., "John_3_16"
    count: number;
    lastUsedAt: Timestamp | Date;
}

export interface MomentGenerationJob {
    id?: string;
    status: 'queued' | 'generating' | 'completed' | 'error';
    params: {
        category: string;
        intents: string[];
        count: number;
        themeKeywords?: string;
        includeBooks?: string[];
        excludeBooks?: string[];
        model?: string;
    };
    generatedCount: number;
    requestedCount: number;
    errors?: string[];
    createdBy: string;
    createdAt: Timestamp | Date;
    completedAt?: Timestamp | Date;
}
