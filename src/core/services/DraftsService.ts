import { openDB, type DBSchema } from 'idb';
import type { PostType } from '../data/mockData';

export interface Draft {
    id: string; // uuid
    type: PostType | null;
    content: string; // Caption or Text
    mediaFile?: File; // Stored as Blob in IDB
    verseData?: { ref: string; text: string; id?: string };
    song?: any;
    sharedMoment?: any; // Moment data
    visibility?: 'public' | 'private';
    background?: string;
    updatedAt: number;
}

interface DraftsDB extends DBSchema {
    drafts: {
        key: string;
        value: Draft;
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'faithvoice-drafts';
const STORE_NAME = 'drafts';

export const DraftsService = {
    async getDB() {
        return openDB<DraftsDB>(DB_NAME, 2, {
            upgrade(db) {
                // Version 1 setup (if it didn't exist)
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('by-date', 'updatedAt');
                } else {
                    // Upgrade path (e.g. if index is missing)
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('by-date')) {
                        if (store) {
                            (store as any).createIndex('by-date', 'updatedAt');
                        }
                    }
                }
            },
        });
    },

    async saveDraft(draft: Draft) {
        const db = await this.getDB();
        await db.put(STORE_NAME, { ...draft, updatedAt: Date.now() });
    },

    async getDraft(id: string) {
        const db = await this.getDB();
        return db.get(STORE_NAME, id);
    },

    async getAllDrafts() {
        const db = await this.getDB();
        return db.getAllFromIndex(STORE_NAME, 'by-date');
    },

    async deleteDraft(id: string) {
        const db = await this.getDB();
        await db.delete(STORE_NAME, id);
    },

    async clearDrafts() {
        const db = await this.getDB();
        await db.clear(STORE_NAME);
    }
};
