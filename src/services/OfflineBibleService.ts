import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { BibleBook, BibleChapter } from '../types/bible';

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

    private getChapterKey(version: string, bookId: string, chapterNum: number): string {
        return `${version}_${bookId}_${chapterNum}`;
    }

    private getDownloadKey(version: string, bookId: string): string {
        return `${version}_${bookId}`;
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

    async saveChapter(version: string, bookId: string, chapter: BibleChapter): Promise<void> {
        const db = await this.dbPromise;
        await db.put('chapters', {
            ...chapter,
            bookId,
            version,
            id: this.getChapterKey(version, bookId, chapter.number)
        } as any);
    }

    async getChapter(version: string, bookId: string, chapterNum: number): Promise<BibleChapter | undefined> {
        const db = await this.dbPromise;

        // Try new key format
        let result = await db.get('chapters', this.getChapterKey(version, bookId, chapterNum));

        // Fallback for BSB legacy keys
        if (!result && version === 'bsb') {
            result = await db.get('chapters', `${bookId}_${chapterNum}`);
        }

        if (result) {
            const { id, bookId: _b, version: _v, ...chapter } = result as any;
            return chapter as BibleChapter;
        }
        return undefined;
    }

    async markBookDownloadComplete(version: string, bookId: string): Promise<void> {
        const db = await this.dbPromise;
        await db.put('downloads', {
            bookId: this.getDownloadKey(version, bookId), // Use composite key as ID
            isComplete: true,
            lastUpdated: Date.now(),
            originalBookId: bookId,
            version
        } as any);
    }

    async isBookDownloaded(version: string, bookId: string): Promise<boolean> {
        const db = await this.dbPromise;
        // Try new key
        let record = await db.get('downloads', this.getDownloadKey(version, bookId));

        // Fallback for BSB
        if (!record && version === 'bsb') {
            record = await db.get('downloads', bookId);
        }

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
