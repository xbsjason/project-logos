import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import { offlineBibleService } from './OfflineBibleService';

export interface BibleBook {
    id: string;
    name: string;
    order: number;
    chapterCount: number;
}

export interface BibleVerse {
    verse: number;
    text: string;
}

export interface BibleChapter {
    number: number;
    verses: BibleVerse[];
}

const BIBLE_ID = 'bsb'; // Hardcoded for now, could be dynamic later

export const BibleService = {
    async getBooks(): Promise<BibleBook[]> {
        try {
            // Try offline first
            const cachedBooks = await offlineBibleService.getBooks();
            if (cachedBooks && cachedBooks.length > 0) {
                // Return cached books immediately, but maybe update in background if needed?
                // For Bible books, list is static, so cache is fine.
                return cachedBooks;
            }

            const booksRef = collection(db, 'bibles', BIBLE_ID, 'books');
            const q = query(booksRef, orderBy('order'));
            const snapshot = await getDocs(q);
            const books = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BibleBook));

            // Cache for next time
            await offlineBibleService.saveBooks(books);
            return books;
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    },

    async getChapter(bookId: string, chapterNum: number): Promise<BibleChapter | null> {
        try {
            // 1. Check local cache
            const cachedChapter = await offlineBibleService.getChapter(bookId, chapterNum);
            if (cachedChapter) {
                // If we have this chapter, we might want to trigger a background download regarding the rest of the book
                // But we should do it in a non-blocking way.
                this.checkAndDownloadBook(bookId).catch(err => console.error('Background download trigger failed', err));
                return cachedChapter;
            }

            // 2. Fetch from Firebase
            const chapterRef = doc(db, 'bibles', BIBLE_ID, 'books', bookId, 'chapters', String(chapterNum));
            const snapshot = await getDoc(chapterRef);

            if (!snapshot.exists()) return null;
            const chapterData = snapshot.data() as BibleChapter;

            // 3. Save to cache
            await offlineBibleService.saveChapter(bookId, chapterData);

            // 4. Trigger background download of the rest of the book
            this.checkAndDownloadBook(bookId).catch(err => console.error('Background download trigger failed', err));

            return chapterData;
        } catch (error) {
            console.error(`Error fetching chapter ${bookId} ${chapterNum}:`, error);
            throw error;
        }
    },

    // Background process to download the entire book
    async checkAndDownloadBook(bookId: string) {
        const isDownloaded = await offlineBibleService.isBookDownloaded(bookId);
        if (isDownloaded) return;

        // Start downloading...
        console.log(`Starting background download for book: ${bookId}`);

        try {
            // Get book details to know how many chapters
            const books = await this.getBooks();
            const book = books.find(b => b.id === bookId);
            if (!book) return;

            // We will fetch chapters in batches or sequentially to not overwhelm
            // For simplicity, let's just fetch them 
            // Note: This might be a lot of reads. 
            // Better strategy: Check which chapters are missing? 
            // For now, let's just loop and fetch if missing from cache.

            // We'll process in chunks of 5 parallel requests
            const batchSize = 5;
            for (let i = 1; i <= book.chapterCount; i += batchSize) {
                const limit = Math.min(i + batchSize - 1, book.chapterCount);
                const promises = [];
                for (let ch = i; ch <= limit; ch++) {
                    promises.push(this.ensureChapterCached(bookId, ch));
                }
                await Promise.all(promises);
            }

            await offlineBibleService.markBookDownloadComplete(bookId);
            console.log(`Completed background download for book: ${bookId}`);
        } catch (error) {
            console.error(`Error in background download for ${bookId}:`, error);
            // Don't throw, as this is background
        }
    },

    async ensureChapterCached(bookId: string, chapterNum: number): Promise<void> {
        const cached = await offlineBibleService.getChapter(bookId, chapterNum);
        if (cached) return;

        // Fetch and save
        const chapterRef = doc(db, 'bibles', BIBLE_ID, 'books', bookId, 'chapters', String(chapterNum));
        const snapshot = await getDoc(chapterRef);
        if (snapshot.exists()) {
            await offlineBibleService.saveChapter(bookId, snapshot.data() as BibleChapter);
        }
    },

    async downloadAllBooks(): Promise<void> {
        const books = await this.getBooks();
        // Process books in chunks of 3 to avoid overwhelming connections
        const chunk = 3;
        for (let i = 0; i < books.length; i += chunk) {
            const batch = books.slice(i, i + chunk);
            await Promise.all(batch.map(book => this.checkAndDownloadBook(book.id)));
        }
    }
};
