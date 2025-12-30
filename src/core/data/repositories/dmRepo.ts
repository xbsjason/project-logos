import { dbPromise, type Message, type Thread } from '../db/db';
import { db as firestore } from '../../services/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    addDoc,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';

export const dmRepo = {
    // Threads
    async getThreads(): Promise<Thread[]> {
        const db = await dbPromise;
        return db.getAllFromIndex('threads', 'by-date');
    },

    async getThread(id: string): Promise<Thread | undefined> {
        const db = await dbPromise;
        return db.get('threads', id);
    },

    async saveThread(thread: Thread): Promise<void> {
        const db = await dbPromise;
        await db.put('threads', thread);
    },

    async deleteThread(id: string): Promise<void> {
        const db = await dbPromise;
        await db.delete('threads', id);
        // Also delete messages for this thread? For now, keep them orphaned or clean up separately.
    },

    // Messages
    async getMessagesForThread(threadId: string): Promise<Message[]> {
        const db = await dbPromise;
        return db.getAllFromIndex('messages', 'by-thread', threadId);
    },

    async addMessage(message: Message): Promise<void> {
        const db = await dbPromise;
        await db.put('messages', message);

        // Update thread lastMessage
        const thread = await db.get('threads', message.threadId);
        if (thread) {
            thread.lastMessage = message.text;
            thread.lastMessageAt = message.createdAt;
            if (message.senderId !== 'me') { // Simplification, need real ID check
                thread.unreadCount += 1;
            }
            await db.put('threads', thread);
        }
    },

    async markThreadRead(threadId: string): Promise<void> {
        const db = await dbPromise;
        const thread = await db.get('threads', threadId);
        if (thread) {
            thread.unreadCount = 0;
            await db.put('threads', thread);
        }
    },

    // Firestore Sync Methods
    async syncThreadsFromFirestore(userId: string): Promise<void> {
        const db = await dbPromise;
        const q = query(
            collection(firestore, 'threads'),
            where('participants', 'array-contains', userId)
        );

        const snapshot = await getDocs(q);
        const tx = db.transaction('threads', 'readwrite');
        const store = tx.objectStore('threads');

        for (const firestoreDoc of snapshot.docs) {
            const data = firestoreDoc.data();
            const thread: Thread = {
                id: firestoreDoc.id,
                participants: data.participants,
                lastMessage: data.lastMessage || '',
                lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                unreadCount: data.unreadCount?.[userId] || 0,
                metadata: data.metadata
            };
            await store.put(thread);
        }
        await tx.done;
    },

    async syncMessagesFromFirestore(threadId: string): Promise<void> {
        const db = await dbPromise;
        const q = query(
            collection(firestore, 'threads', threadId, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        const tx = db.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');

        for (const firestoreDoc of snapshot.docs) {
            const data = firestoreDoc.data();
            const message: Message = {
                id: firestoreDoc.id,
                threadId: threadId,
                senderId: data.senderId,
                text: data.text,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                status: 'sent',
                attachments: data.attachments
            };
            await store.put(message);
        }
        await tx.done;
    },

    async saveMessageToFirestore(message: Message): Promise<void> {
        const threadRef = doc(firestore, 'threads', message.threadId);
        const messagesRef = collection(threadRef, 'messages');

        await addDoc(messagesRef, {
            senderId: message.senderId,
            text: message.text,
            createdAt: serverTimestamp(),
            attachments: message.attachments || []
        });

        // Update thread preview
        await setDoc(threadRef, {
            lastMessage: message.text,
            lastMessageAt: serverTimestamp(),
            [`unreadCount.${message.senderId}`]: 0 // Reset sender's unread
            // Recipient's unread should be handled by a Cloud Function or manually if needed
        }, { merge: true });
    },

    async createFirestoreThread(userId: string, participantId: string): Promise<string> {
        const threadsRef = collection(firestore, 'threads');
        const newThreadDoc = await addDoc(threadsRef, {
            participants: [userId, participantId],
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            unreadCount: {
                [userId]: 0,
                [participantId]: 0
            },
            createdAt: serverTimestamp()
        });
        return newThreadDoc.id;
    }
};
