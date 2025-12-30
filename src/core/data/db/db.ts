import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Notification {
    id: string; // UUID
    type: 'message' | 'system' | 'mention' | 'follow' | 'reply'; // Expandable
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string; // ISO string
    link?: string; // Deep link URL
    data?: Record<string, any>; // Flexible metadata
}

export interface Thread {
    id: string;
    participants: string[]; // User IDs (sender + receiver)
    lastMessage: string;
    lastMessageAt: string; // ISO string
    unreadCount: number;
    metadata?: {
        participantDetails?: any; // Cached user info to avoid frequent fetching
    };
}

export interface Message {
    id: string;
    threadId: string;
    senderId: string;
    text: string;
    createdAt: string; // ISO string
    status: 'sending' | 'sent' | 'failed' | 'read';
    readAt?: string;
    attachments?: {
        type: 'image' | 'video' | 'file';
        url: string;
    }[];
}

export interface UserSettings {
    id: string; // 'global' or userId
    pushEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    channels: {
        messages: boolean;
        mentions: boolean;
        likes: boolean;
        comments: boolean;
        system: boolean;
    };
}

interface AppDB extends DBSchema {
    notifications: {
        key: string;
        value: Notification;
        indexes: { 'by-date': string; 'by-read': number };
    };
    threads: {
        key: string;
        value: Thread;
        indexes: { 'by-date': string };
    };
    messages: {
        key: string;
        value: Message;
        indexes: { 'by-thread': string; 'by-date': string };
    };
    settings: {
        key: string;
        value: UserSettings;
    };
}

const DB_NAME = 'faithvoice-db';
const DB_VERSION = 3; // Bumped to 3 for new settings structure

export async function initDB(): Promise<IDBPDatabase<AppDB>> {
    return openDB<AppDB>(DB_NAME, DB_VERSION, {
        upgrade(db, _oldVersion, _newVersion, transaction) {
            // Notifications
            if (!db.objectStoreNames.contains('notifications')) {
                const store = db.createObjectStore('notifications', { keyPath: 'id' });
                store.createIndex('by-date', 'createdAt');
                store.createIndex('by-read', 'isRead');
            } else {
                const store = transaction.objectStore('notifications');
                if (!store.indexNames.contains('by-date')) {
                    store.createIndex('by-date', 'createdAt');
                }
                if (!store.indexNames.contains('by-read')) {
                    store.createIndex('by-read', 'isRead');
                }
            }

            // Threads
            if (!db.objectStoreNames.contains('threads')) {
                const store = db.createObjectStore('threads', { keyPath: 'id' });
                store.createIndex('by-date', 'lastMessageAt');
            } else {
                const store = transaction.objectStore('threads');
                if (!store.indexNames.contains('by-date')) {
                    store.createIndex('by-date', 'lastMessageAt');
                }
            }

            // Messages
            if (!db.objectStoreNames.contains('messages')) {
                const store = db.createObjectStore('messages', { keyPath: 'id' });
                store.createIndex('by-thread', 'threadId');
                store.createIndex('by-date', 'createdAt');
            } else {
                const store = transaction.objectStore('messages');
                if (!store.indexNames.contains('by-thread')) {
                    store.createIndex('by-thread', 'threadId');
                }
                if (!store.indexNames.contains('by-date')) {
                    store.createIndex('by-date', 'createdAt');
                }
            }

            // Settings
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
        },
    });
}

export const dbPromise = initDB();
