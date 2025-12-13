import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { offlineBibleService } from './OfflineBibleService';

export type { BibleBook, BibleChapter, BibleVerse } from '../types/bible';
import type { BibleBook, BibleChapter } from '../types/bible';
import { getBooksForVersion } from '../constants/bibleData';

export const BibleService = {
    async getBooks(version: string = 'bsb'): Promise<BibleBook[]> {
        try {
            // Use static data for all versions to ensure consistency and speed.
            // This also solves the issue where non-BSB versions have no metadata in Firestore.
            const books = getBooksForVersion(version);

            // Cache for next time to keep offline service populated (useful if we add dynamic features later)
            await offlineBibleService.saveBooks(books);
            return books;
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    },

    async getChapter(version: string, bookId: string, chapterNum: number): Promise<BibleChapter | null> {
        try {
            // 1. Check local cache
            const cachedChapter = await offlineBibleService.getChapter(version, bookId, chapterNum);
            if (cachedChapter) {
                return cachedChapter;
            }

            // 2. Fetch from Firebase
            let chapterData: BibleChapter | null = null;

            if (version === 'bsb') {
                // Legacy path for BSB
                const attemptFetch = async (bId: string) => {
                    const r = doc(db, 'bibles', 'bsb', 'books', bId, 'chapters', String(chapterNum));
                    return await getDoc(r);
                };

                // ID Fallback Logic (fixes "Judges" issue)
                let snapshot = await attemptFetch(bookId);
                if (!snapshot.exists() && bookId !== bookId.toLowerCase()) {
                    console.log(`BSB: First attempt for ${bookId} failed. Trying ${bookId.toLowerCase()}`);
                    snapshot = await attemptFetch(bookId.toLowerCase());
                }

                if (snapshot.exists()) {
                    chapterData = snapshot.data() as BibleChapter;
                }
            } else {
                // New Granular Path: bibles/{version}/verses
                const searchBookId = bookId.toLowerCase(); // Ensure lowercase for new versions (as per import logic)
                const versesRef = collection(db, 'bibles', version, 'verses');
                const q = query(
                    versesRef,
                    where('bookId', '==', searchBookId),
                    where('chapter', '==', chapterNum),
                    orderBy('verse', 'asc')
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const verses = snapshot.docs.map(d => ({
                        verse: d.data().verse,
                        text: d.data().text
                    }));
                    chapterData = {
                        number: chapterNum,
                        verses: verses
                    };
                }
            }

            if (!chapterData) return null;

            // 3. Save to cache
            await offlineBibleService.saveChapter(version, bookId, chapterData);

            return chapterData;
        } catch (error: any) {
            console.error(`Error fetching chapter version=${version} book=${bookId} chapter=${chapterNum}:`, error);
            if (error?.code) {
                console.error('Firestore Error Code:', error.code);
            }
            throw error;
        }
    },

    // Background process to download the entire book
    async checkAndDownloadBook(version: string, bookId: string) {
        // Universal download support
        const isDownloaded = await offlineBibleService.isBookDownloaded(version, bookId);
        if (isDownloaded) return;

        console.log(`Starting background download for ${version} book: ${bookId}`);

        try {
            const books = await this.getBooks(version);
            const book = books.find(b => b.id === bookId);
            if (!book) return;

            const batchSize = 5;
            for (let i = 1; i <= book.chapterCount; i += batchSize) {
                const limitNum = Math.min(i + batchSize - 1, book.chapterCount);
                const promises = [];
                for (let ch = i; ch <= limitNum; ch++) {
                    promises.push(this.ensureChapterCached(version, bookId, ch));
                }
                await Promise.all(promises);
            }

            await offlineBibleService.markBookDownloadComplete(version, bookId);
            console.log(`Completed background download for ${version} book: ${bookId}`);
        } catch (error) {
            console.error(`Error in background download for ${version} ${bookId}:`, error);
        }
    },

    async ensureChapterCached(version: string, bookId: string, chapterNum: number): Promise<void> {
        // Leverages getChapter to fetch and cache if missing
        await this.getChapter(version, bookId, chapterNum);
    },

    async downloadAllBooks(version: string = 'bsb'): Promise<void> {
        const books = await this.getBooks(version);
        const chunk = 3;
        for (let i = 0; i < books.length; i += chunk) {
            const batch = books.slice(i, i + chunk);
            await Promise.all(batch.map(book => this.checkAndDownloadBook(version, book.id)));
        }
    }
};
