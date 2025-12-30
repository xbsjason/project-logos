import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, deleteDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { BibleProgressService, type BibleLocation, type Bookmark } from '../services/BibleProgressService';
import { UserStatsService } from '../services/UserStatsService';

interface CompletedChapter {
    bookId: string;
    chapter: number;
    version?: string;
    completedAt: any;
}

interface BibleProgressContextType {
    lastRead: BibleLocation | null;
    bookmarks: Bookmark[];
    completedChapters: CompletedChapter[];
    loading: boolean;
    saveProgress: (location: BibleLocation) => Promise<void>;
    toggleBookmark: (location: BibleLocation) => Promise<void>;
    isBookmarked: (bookId: string, chapter: number, verse: number, version?: string) => boolean;
    refreshBookmarks: () => Promise<void>;
    trackPrayer: () => Promise<void>;
    markChapterCompleted: (bookId: string, chapter: number, version?: string) => Promise<void>;
    isChapterCompleted: (bookId: string, chapter: number, version?: string) => boolean;
    resetProgress: () => Promise<void>;
}

const BibleProgressContext = createContext<BibleProgressContextType | undefined>(undefined);

export function BibleProgressProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [lastRead, setLastRead] = useState<BibleLocation | null>(null);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [completedChapters, setCompletedChapters] = useState<CompletedChapter[]>([]);
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
            const [lastReadData, bookmarksData, completedDocs] = await Promise.all([
                BibleProgressService.getLastRead(user.uid),
                BibleProgressService.getBookmarks(user.uid),
                getDocs(collection(db, 'users', user.uid, 'completed_chapters'))
            ]);
            setLastRead(lastReadData);
            setBookmarks(bookmarksData);

            const completed: CompletedChapter[] = completedDocs.docs.map(doc => {
                const data = doc.data();
                return {
                    bookId: data.bookId,
                    chapter: data.chapter,
                    version: data.version,
                    completedAt: data.completedAt
                };
            });
            setCompletedChapters(completed);
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

        const targetVersion = location.version || 'bsb';
        const isAlreadyBookmarked = isBookmarked(location.bookId, location.chapter, location.verse, targetVersion);

        if (isAlreadyBookmarked) {
            // Remove
            setBookmarks(prev => prev.filter(b =>
                !(b.bookId === location.bookId && b.chapter === location.chapter && b.verse === location.verse && (b.version || 'bsb') === targetVersion)
            ));
            await BibleProgressService.removeBookmark(user.uid, { ...location, version: targetVersion });
        } else {
            // Add
            const newBookmark: Bookmark = {
                ...location,
                version: targetVersion,
                id: `${targetVersion}_${location.bookId}_${location.chapter}_${location.verse}`,
                createdAt: new Date() // Temporary local date
            };
            setBookmarks(prev => [newBookmark, ...prev]);
            await BibleProgressService.addBookmark(user.uid, { ...location, version: targetVersion });

            // Track activity
            await UserStatsService.incrementStat(user.uid, 'versesRead'); // Just using versesRead as a proxy for "engagement" for now, or maybe make a specific 'bookmarksCount'
            await UserStatsService.trackActivity(user.uid, 'bookmark', { ...location, version: targetVersion });
        }
    };

    const isBookmarked = (bookId: string, chapter: number, verse: number, version?: string) => {
        const targetVersion = version || 'bsb';
        return bookmarks.some(b =>
            b.bookId === bookId &&
            b.chapter === chapter &&
            b.verse === verse &&
            (b.version || 'bsb') === targetVersion
        );
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

    const isChapterCompleted = (bookId: string, chapter: number, version?: string) => {
        // If version is provided, check for specific version match
        // Legacy data might exist without version (defaulting to BSB essentially),
        // but moving forward we want strict checking.
        // For "universal" legacy behavior (if we wanted it), we'd check for matches OR missing version.
        // But user request implies they want separation.
        const targetVersion = version || 'bsb';
        return completedChapters.some(c =>
            c.bookId === bookId &&
            c.chapter === chapter &&
            (c.version === targetVersion || (!c.version && targetVersion === 'bsb')) // Fallback for legacy BSB
        );
    };

    const markChapterCompleted = async (bookId: string, chapter: number, version?: string) => {
        if (!user) return;

        if (isChapterCompleted(bookId, chapter, version)) return;

        const targetVersion = version || 'bsb';

        const newCompletion: CompletedChapter = {
            bookId,
            chapter,
            version: targetVersion,
            completedAt: new Date()
        };

        setCompletedChapters(prev => [...prev, newCompletion]);

        // Firestore
        // Use version in ID to separate progress
        const completionId = `${targetVersion}_${bookId}_${chapter}`;

        await setDoc(doc(db, 'users', user.uid, 'completed_chapters', completionId), {
            bookId,
            chapter,
            version: targetVersion,
            completedAt: serverTimestamp()
        });

        // Stats
        await UserStatsService.incrementStat(user.uid, 'chaptersRead');
        await UserStatsService.trackActivity(user.uid, 'reading', { action: 'chapter_completed', bookId, chapter, version: version || 'bsb' });
    };

    const resetProgress = async () => {
        if (!user) return;

        // Optimistic clear
        setLastRead(null);
        setBookmarks([]);
        setCompletedChapters([]);

        try {
            // Delete Last Read
            await deleteDoc(doc(db, 'users', user.uid, 'progress', 'bible'));

            // Delete Bookmarks (Batch/Loop - careful with large datasets, but ok for individual user usually)
            const bookmarksSnap = await getDocs(collection(db, 'users', user.uid, 'bookmarks'));
            bookmarksSnap.forEach(async (d) => {
                await deleteDoc(d.ref); // Should use batch ideally, but this is simple for now
            });

            // Delete Completed Chapters
            const completedSnap = await getDocs(collection(db, 'users', user.uid, 'completed_chapters'));
            completedSnap.forEach(async (d) => {
                await deleteDoc(d.ref);
            });

            // Reset Stats? 
            // Usually gamification stats persist even if reading progress resets, 
            // but user might expect 'reset' to mean everything. 
            // For now, let's keep the stats (verses read count) as legacy achievement, 
            // but clear the functional navigation data.
        } catch (error) {
            console.error("Error resetting progress:", error);
        }
    };

    return (
        <BibleProgressContext.Provider value={{
            lastRead,
            bookmarks,
            completedChapters,
            loading,
            saveProgress,
            toggleBookmark,
            isBookmarked,
            refreshBookmarks,
            trackPrayer,
            markChapterCompleted,
            isChapterCompleted,
            resetProgress
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
