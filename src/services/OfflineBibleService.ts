import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { BibleBook, BibleChapter } from './BibleService';

const DB_NAME = 'faithvoice-bible-db';
const DB_VERSION = 1;

interface OfflineBibleSchema extends DBSchema {
    books: {
        key: string; // bookId
        value: BibleBook;
    };
    chapters: {
        key: string; // composite key: bookId_chapterNum
        value: BibleChapter & { bookId: string };
        indexes: { 'by-book': string };
    };
    downloads: {
        key: string; // bookId
        value: {
            bookId: string;
            isComplete: boolean;
            lastUpdated: number;
        };
    };
}

class OfflineBibleService {
    private dbPromise: Promise<IDBPDatabase<OfflineBibleSchema>>;

    constructor() {
        this.dbPromise = openDB<OfflineBibleSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Store metadata about books
                if (!db.objectStoreNames.contains('books')) {
                    db.createObjectStore('books', { keyPath: 'id' });
                }

                // Store chapters
                if (!db.objectStoreNames.contains('chapters')) {
                    const store = db.createObjectStore('chapters', { keyPath: 'id' }); // We'll add an ID to the chapter object when saving
                    store.createIndex('by-book', 'bookId');
                }

                // Store download status
                if (!db.objectStoreNames.contains('downloads')) {
                    db.createObjectStore('downloads', { keyPath: 'bookId' });
                }
            },
        });
    }

    private getChapterKey(bookId: string, chapterNum: number): string {
        return `${bookId}_${chapterNum}`;
    }

    async saveBooks(books: BibleBook[]): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction('books', 'readwrite');
        await Promise.all([
            ...books.map(book => tx.store.put(book)),
            tx.done
        ]);
    }

    async getBooks(): Promise<BibleBook[]> {
        const db = await this.dbPromise;
        return db.getAll('books');
    }

    async saveChapter(bookId: string, chapter: BibleChapter): Promise<void> {
        const db = await this.dbPromise;
        await db.put('chapters', {
            ...chapter,
            bookId,
            id: this.getChapterKey(bookId, chapter.number)
        } as any);
    }

    async getChapter(bookId: string, chapterNum: number): Promise<BibleChapter | undefined> {
        const db = await this.dbPromise;
        const result = await db.get('chapters', this.getChapterKey(bookId, chapterNum));
        if (result) {
            // Remove the internal ID and bookId before returning to match BibleChapter interface strictly if needed,
            // but keeping them is usually fine.
            const { id, bookId: _b, ...chapter } = result as any;
            return chapter as BibleChapter;
        }
        return undefined;
    }

    async markBookDownloadComplete(bookId: string): Promise<void> {
        const db = await this.dbPromise;
        await db.put('downloads', {
            bookId,
            isComplete: true,
            lastUpdated: Date.now(),
        });
    }

    async isBookDownloaded(bookId: string): Promise<boolean> {
        const db = await this.dbPromise;
        const record = await db.get('downloads', bookId);
        return !!record?.isComplete;
    }

    async clearAll(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear('books');
        await db.clear('chapters');
        await db.clear('downloads');
    }
}

export const offlineBibleService = new OfflineBibleService();
