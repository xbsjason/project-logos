import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsRepo } from '../data/repositories/notificationsRepo';
import { dmRepo } from '../data/repositories/dmRepo';
import { settingsRepo } from '../data/repositories/settingsRepo'; // Added
import { type Notification, type Thread, type Message } from '../data/db/db';
import { useAuth } from './AuthContext';
import { db as firestore } from '../services/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';

interface NotificationContextType {
    unreadNotifications: number;
    unreadDMs: number;
    notifications: Notification[];
    threads: Thread[];
    isLoading: boolean;

    // Actions
    refresh: () => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;
    clearAllNotifications: () => Promise<void>;

    // DM Actions
    loadThread: (threadId: string) => Promise<Thread | undefined>;
    sendMessage: (threadId: string, text: string) => Promise<void>;
    createThread: (participantId: string) => Promise<string>;
    markThreadRead: (threadId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadDMs, setUnreadDMs] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!user) return;

        // Log for debugging
        console.log('[NotificationContext] Refreshing data...');

        try {
            const [allNotifs, allThreads] = await Promise.all([
                notificationsRepo.getAll(),
                dmRepo.getThreads()
            ]);

            // Sort notifications desc
            const sortedNotifs = allNotifs.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            // Sort threads desc
            const sortedThreads = allThreads.sort((a, b) =>
                new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            );

            // NEW: Fetch settings
            const settings = await settingsRepo.getSettings(user.uid);

            // Filter based on channels
            const filteredNotifs = sortedNotifs.filter(n => {
                if (!settings) return true;
                if (n.type === 'message' && !settings.channels.messages) return false;
                if (n.type === 'mention' && !settings.channels.mentions) return false;
                if (n.type === 'reply' && !settings.channels.mentions) return false; // Group replies with mentions for now
                // Add checks for new types filtering if/when `n.type` supports 'like' or 'comment'
                // Assuming standard notification types: 'like', 'comment' might need to be added to Notification type definition or mapped
                // For now, if we receive 'mention' type but content implies like/comment, we handle it?
                // Actually the db schema says type: 'message' | 'system' | 'mention' | 'follow' | 'reply'
                // If we want to support 'like' and 'comment' types, we should update DB type definition too, 
                // but for now let's assume 'mention' covers generic interactions or we rely on 'data' field.

                // Let's assume standard filtering for existing types is enough for now, 
                // but if we had `like` type:
                // if (n.type === 'like' && !settings.channels.likes) return false;
                return true;
            });

            // Grouping Logic
            const groupedNotifs: Notification[] = [];
            const processedIds = new Set<string>();

            for (const n of filteredNotifs) {
                if (processedIds.has(n.id)) continue;

                // Simple grouping by title + link (e.g. "X liked your post", link="/post/123")
                // Only group if it's not a direct message
                if (n.type !== 'message') {
                    const similar = filteredNotifs.filter(other =>
                        !processedIds.has(other.id) &&
                        other.type === n.type &&
                        other.link === n.link &&
                        other.title === n.title // e.g. "Post Like"
                    );

                    if (similar.length > 1) {
                        // Create a group representative
                        const group: Notification = {
                            ...n,
                            body: `${similar.length} new interactions`, // Simplified body
                            data: { ...n.data, count: similar.length, groupIds: similar.map(s => s.id) }
                        };
                        // Mark all as processed
                        similar.forEach(s => processedIds.add(s.id));
                        groupedNotifs.push(group);
                        continue;
                    }
                }

                processedIds.add(n.id);
                groupedNotifs.push(n);
            }

            setNotifications(groupedNotifs);
            setThreads(sortedThreads);

            // Calc unread
            const unreadNotifCount = sortedNotifs.filter(n => !n.isRead).length;
            const unreadDMCount = sortedThreads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

            setUnreadNotifications(unreadNotifCount);
            setUnreadDMs(unreadDMCount);

            console.log(`[NotificationContext] Refreshed. Unread Notifs: ${unreadNotifCount}, Unread DMs: ${unreadDMCount}`);
        } catch (err) {
            console.error('[NotificationContext] Error refreshing data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial load and Real-time sync
    useEffect(() => {
        if (!user) return;

        console.log('[NotificationContext] Setting up real-time listeners for user:', user.uid);

        // 1. Listen for Notifications
        const qNotifs = query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubNotifs = onSnapshot(qNotifs, async () => {
            console.log('[NotificationContext] Notifications update detected in Firestore');
            await notificationsRepo.syncFromFirestore(user.uid);
            refresh();
        });

        // 2. Listen for Threads
        const qThreads = query(
            collection(firestore, 'threads'),
            where('participants', 'array-contains', user.uid)
        );

        const unsubThreads = onSnapshot(qThreads, async (snapshot) => {
            console.log('[NotificationContext] Threads update detected in Firestore');
            await dmRepo.syncThreadsFromFirestore(user.uid);

            // Proactively sync messages for changed threads
            for (const change of snapshot.docChanges()) {
                if (change.type === 'added' || change.type === 'modified') {
                    await dmRepo.syncMessagesFromFirestore(change.doc.id);
                }
            }

            await refresh();
        });

        return () => {
            unsubNotifs();
            unsubThreads();
        };
    }, [user, refresh]);

    const markNotificationRead = async (id: string) => {
        if (!user) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadNotifications(prev => Math.max(0, prev - 1));

        await notificationsRepo.markAsRead(id, user.uid);
    };

    const markAllNotificationsRead = async () => {
        if (!user) return;

        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadNotifications(0);

        await notificationsRepo.markAllAsRead(user.uid);
    };

    const clearAllNotifications = async () => {
        await notificationsRepo.clearAll();
        setNotifications([]);
        setUnreadNotifications(0);
    };

    const loadThread = async (threadId: string) => {
        return dmRepo.getThread(threadId);
    };

    const sendMessage = async (threadId: string, text: string) => {
        if (!user) return;

        const message: Message = {
            id: crypto.randomUUID(),
            threadId,
            senderId: user.uid,
            text,
            createdAt: new Date().toISOString(),
            status: 'sent'
        };

        // 1. Optimistic local update
        await dmRepo.addMessage(message);

        // 2. Write to Firestore
        await dmRepo.saveMessageToFirestore(message);

        await refresh();
    };

    const createThread = async (participantId: string) => {
        if (!user) throw new Error('Not logged in');

        // 1. Check if thread exists in local IndexedDB
        const existing = threads.find(t => t.participants.includes(participantId));
        if (existing) return existing.id;

        // 2. Double check Firestore for existing thread between these users
        const q = query(
            collection(firestore, 'threads'),
            where('participants', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(q);
        const firestoreExisting = snapshot.docs.find((d: any) =>
            d.data().participants.includes(participantId)
        );

        if (firestoreExisting) {
            await dmRepo.syncThreadsFromFirestore(user.uid);
            await refresh();
            return firestoreExisting.id;
        }

        // 3. Create new thread in Firestore
        const threadId = await dmRepo.createFirestoreThread(user.uid, participantId);

        // 4. Sync threads back to local
        await dmRepo.syncThreadsFromFirestore(user.uid);
        await refresh();

        return threadId;
    };

    const markThreadRead = async (threadId: string) => {
        await dmRepo.markThreadRead(threadId);
        // Optimistic
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t));
        // Re-calc global unread (approximate)
        // Better to just refresh?
        await refresh();
    };

    return (
        <NotificationContext.Provider value={{
            unreadNotifications,
            unreadDMs,
            notifications,
            threads,
            isLoading,
            refresh,
            markNotificationRead,
            markAllNotificationsRead,
            clearAllNotifications,
            loadThread,
            sendMessage,
            createThread,
            markThreadRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
