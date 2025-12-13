import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { BibleProgressService, type BibleLocation, type Bookmark } from '../services/BibleProgressService';
import { UserStatsService } from '../services/UserStatsService';

interface BibleProgressContextType {
    lastRead: BibleLocation | null;
    bookmarks: Bookmark[];
    loading: boolean;
    saveProgress: (location: BibleLocation) => Promise<void>;
    toggleBookmark: (location: BibleLocation) => Promise<void>;
    isBookmarked: (bookId: string, chapter: number, verse: number) => boolean;
    refreshBookmarks: () => Promise<void>;
    trackPrayer: () => Promise<void>;
}

const BibleProgressContext = createContext<BibleProgressContextType | undefined>(undefined);

export function BibleProgressProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [lastRead, setLastRead] = useState<BibleLocation | null>(null);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load
    useEffect(() => {
        if (user) {
            loadUserData();
        } else {
            setLastRead(null);
            setBookmarks([]);
            setLoading(false);
        }
    }, [user]);

    const loadUserData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [lastReadData, bookmarksData] = await Promise.all([
                BibleProgressService.getLastRead(user.uid),
                BibleProgressService.getBookmarks(user.uid)
            ]);
            setLastRead(lastReadData);
            setBookmarks(bookmarksData);
        } catch (error) {
            console.error('Failed to load bible progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveProgress = async (location: BibleLocation) => {
        if (!user) return;
        // Optimistic update
        setLastRead(location);
        await BibleProgressService.saveLastRead(user.uid, location);

        // Also track general activity occasionally? Maybe not every scroll.
        // Keeping it simple for now.
    };

    const toggleBookmark = async (location: BibleLocation) => {
        if (!user || !location.verse) return;

        const isAlreadyBookmarked = isBookmarked(location.bookId, location.chapter, location.verse);

        if (isAlreadyBookmarked) {
            // Remove
            setBookmarks(prev => prev.filter(b =>
                !(b.bookId === location.bookId && b.chapter === location.chapter && b.verse === location.verse)
            ));
            await BibleProgressService.removeBookmark(user.uid, location);
        } else {
            // Add
            const newBookmark: Bookmark = {
                ...location,
                id: `${location.bookId}_${location.chapter}_${location.verse}`,
                createdAt: new Date() // Temporary local date
            };
            setBookmarks(prev => [newBookmark, ...prev]);
            await BibleProgressService.addBookmark(user.uid, location);

            // Track activity
            await UserStatsService.incrementStat(user.uid, 'versesRead'); // Just using versesRead as a proxy for "engagement" for now, or maybe make a specific 'bookmarksCount'
            await UserStatsService.trackActivity(user.uid, 'bookmark', location);
        }
    };

    const isBookmarked = (bookId: string, chapter: number, verse: number) => {
        return bookmarks.some(b => b.bookId === bookId && b.chapter === chapter && b.verse === verse);
    };

    const refreshBookmarks = async () => {
        if (!user) return;
        const data = await BibleProgressService.getBookmarks(user.uid);
        setBookmarks(data);
    };

    const trackPrayer = async () => {
        if (!user) return;
        await UserStatsService.incrementStat(user.uid, 'prayersCount');
        await UserStatsService.trackActivity(user.uid, 'prayer', {});
    };

    return (
        <BibleProgressContext.Provider value={{
            lastRead,
            bookmarks,
            loading,
            saveProgress,
            toggleBookmark,
            isBookmarked,
            refreshBookmarks,
            trackPrayer
        }}>
            {children}
        </BibleProgressContext.Provider>
    );
}

export function useBibleProgress() {
    const context = useContext(BibleProgressContext);
    if (context === undefined) {
        throw new Error('useBibleProgress must be used within a BibleProgressProvider');
    }
    return context;
}
