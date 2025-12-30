import { dbPromise, type Notification } from '../db/db';

export const notificationsRepo = {
    async getAll(): Promise<Notification[]> {
        const db = await dbPromise;
        return db.getAllFromIndex('notifications', 'by-date');
    },

    async getUnreadCount(): Promise<number> {
        const db = await dbPromise;
        const all = await db.getAll('notifications'); // Optimize this later with a dedicated index or count
        return all.filter(n => !n.isRead).length;
    },

    async add(notification: Notification): Promise<void> {
        const db = await dbPromise;
        await db.put('notifications', notification);
    },

    async markAsRead(id: string, userId?: string): Promise<void> {
        const db = await dbPromise;
        const notification = await db.get('notifications', id);
        if (notification) {
            notification.isRead = true;
            await db.put('notifications', notification);
        }

        // Sync to Firestore if userId provided
        if (userId) {
            try {
                const { db: firestore } = await import('../../services/firebase');
                const { doc, updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(firestore, 'users', userId, 'notifications', id), {
                    isRead: true
                });
            } catch (e) {
                console.error("Error syncing read status to Firestore", e);
            }
        }
    },

    async markAllAsRead(userId?: string): Promise<void> {
        const db = await dbPromise;
        const tx = db.transaction('notifications', 'readwrite');
        const store = tx.objectStore('notifications');
        let cursor = await store.openCursor();

        const updatedIds: string[] = [];

        while (cursor) {
            if (!cursor.value.isRead) {
                const update = { ...cursor.value, isRead: true };
                cursor.update(update);
                updatedIds.push(cursor.value.id);
            }
            cursor = await cursor.continue();
        }
        await tx.done;

        // Sync to Firestore if userId provided
        if (userId && updatedIds.length > 0) {
            try {
                const { db: firestore } = await import('../../services/firebase');
                const { writeBatch, doc } = await import('firebase/firestore');

                const batch = writeBatch(firestore);
                // Process in chunks of 500 if needed, but for now assuming < 500 unread
                // (Firestore limit is 500 ops per batch)
                const idsToUpdate = updatedIds.slice(0, 500);

                for (const id of idsToUpdate) {
                    const ref = doc(firestore, 'users', userId, 'notifications', id);
                    batch.update(ref, { isRead: true });
                }

                await batch.commit();

                if (updatedIds.length > 500) {
                    console.warn("Only synced first 500 read status updates to Firestore");
                }

            } catch (e) {
                console.error("Error syncing batch read status to Firestore", e);
            }
        }
    },

    async clearAll(): Promise<void> {
        const db = await dbPromise;
        await db.clear('notifications');
    },

    // Firestore Sync Methods
    async syncFromFirestore(userId: string): Promise<void> {
        const { db: firestore } = await import('../../services/firebase');
        const { collection, query, getDocs, orderBy, limit } = await import('firebase/firestore');

        const db = await dbPromise;
        const q = query(
            collection(firestore, 'users', userId, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const snapshot = await getDocs(q);
        const tx = db.transaction('notifications', 'readwrite');
        const store = tx.objectStore('notifications');

        for (const firestoreDoc of snapshot.docs) {
            const data = firestoreDoc.data();

            // Check local state first to preserve 'isRead' if pending sync
            let isRead = data.isRead || false;
            try {
                const local = await store.get(firestoreDoc.id);
                if (local && local.isRead) {
                    isRead = true;
                }
            } catch (e) {
                // Ignore error, proceed with remote
            }

            const notification: Notification = {
                id: firestoreDoc.id,
                type: data.type,
                title: data.title,
                body: data.body,
                isRead: isRead,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                link: data.link,
                data: data.data
            };
            await store.put(notification);
        }
        await tx.done;
    }
};
