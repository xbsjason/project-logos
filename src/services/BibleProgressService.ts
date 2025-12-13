import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface BibleLocation {
    bookId: string;
    bookName: string;
    chapter: number;
    verse?: number; // Optional, for bookmarks or precision
    version?: string; // Optional, defaults to 'bsb' if missing
    timestamp?: any;
}

export interface Bookmark extends BibleLocation {
    id: string; // Document ID
    note?: string;
    createdAt: any;
}

export const BibleProgressService = {
    /**
     * Save the user's last read location
     */
    async saveLastRead(userId: string, location: BibleLocation) {
        if (!userId) return;

        const progressRef = doc(db, 'users', userId, 'progress', 'bible');
        await setDoc(progressRef, {
            ...location,
            timestamp: serverTimestamp()
        });
    },

    /**
     * Get the user's last read location
     */
    async getLastRead(userId: string): Promise<BibleLocation | null> {
        if (!userId) return null;

        const progressRef = doc(db, 'users', userId, 'progress', 'bible');
        const snap = await getDoc(progressRef);

        if (snap.exists()) {
            return snap.data() as BibleLocation;
        }
        return null;
    },

    /**
     * Add a bookmark
     */
    async addBookmark(userId: string, location: BibleLocation) {
        if (!userId) return;

        // Use a composite ID to prevent duplicates easily: version_bookId_chapter_verse
        const version = location.version || 'bsb';
        const bookmarkId = `${version}_${location.bookId}_${location.chapter}_${location.verse}`;
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);

        await setDoc(bookmarkRef, {
            ...location,
            version, // Ensure version is explicitly saved
            createdAt: serverTimestamp()
        });
    },

    /**
     * Remove a bookmark
     */
    async removeBookmark(userId: string, location: BibleLocation) {
        if (!userId) return;

        const version = location.version || 'bsb';
        const bookmarkId = `${version}_${location.bookId}_${location.chapter}_${location.verse}`;
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);

        await deleteDoc(bookmarkRef);
    },

    /**
     * Get all bookmarks for a user
     */
    async getBookmarks(userId: string): Promise<Bookmark[]> {
        if (!userId) return [];

        const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
        const q = query(bookmarksRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Bookmark));
    }
};
