import { db, messaging } from './firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import type { Notification } from '../data/db/db';

export const NotificationService = {
    async createNotification(
        recipientId: string,
        type: Notification['type'],
        title: string,
        body: string,
        link?: string,
        data?: Record<string, any>
    ) {
        // Don't notify self
        // Note: The caller should handle checking current user ID, but we can do a quick check if needed.
        // However, we don't have access to auth context here easily without passing it in.
        // Let the caller handle the "don't notify self" logic.

        try {
            const notificationRef = collection(db, 'users', recipientId, 'notifications');
            await addDoc(notificationRef, {
                type,
                title,
                body,
                link,
                data,
                isRead: false,
                createdAt: serverTimestamp() // Firestore server timestamp
            });
            console.log(`Notification sent to ${recipientId}`);
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    },

    // Specific Helpers
    async notifyLike(postId: string, postAuthorId: string, likerName: string, likerId: string) {
        if (postAuthorId === likerId) return;

        await this.createNotification(
            postAuthorId,
            'system', // Using 'system' or we could add 'like' to types if DB allows
            'New Like',
            `${likerName} liked your post.`,
            `/post/${postId}`,
            { postId, type: 'like' }
        );
    },

    async notifyComment(postId: string, postAuthorId: string, commenterName: string, commenterId: string, commentText: string) {
        if (postAuthorId === commenterId) return;

        await this.createNotification(
            postAuthorId,
            'message', // Or 'comment'
            'New Comment',
            `${commenterName} commented: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
            `/post/${postId}`,
            { postId, type: 'comment' }
        );
    },

    async notifyReply(postId: string, parentCommentAuthorId: string, replierName: string, replierId: string, replyText: string) {
        if (parentCommentAuthorId === replierId) return;

        await this.createNotification(
            parentCommentAuthorId,
            'reply',
            'New Reply',
            `${replierName} replied: "${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
            `/post/${postId}`,
            { postId, type: 'reply' }
        );
    },

    async notifyMention(
        mentionedUserId: string,
        mentionerName: string,
        mentionerId: string,
        contentType: 'post' | 'comment',
        postId: string,
        commentId: string | null,
        text: string
    ) {
        if (mentionedUserId === mentionerId) return; // Don't notify self

        const link = commentId ? `/post/${postId}#comment-${commentId}` : `/post/${postId}`;
        const preview = text.substring(0, 100);
        const contentLabel = contentType === 'post' ? 'post' : 'comment';

        await this.createNotification(
            mentionedUserId,
            'mention',
            'You were mentioned',
            `${mentionerName} mentioned you in a ${contentLabel}: "${preview}${text.length > 100 ? '...' : ''}"`,
            link,
            { postId, commentId, type: 'mention', contentType }
        );
    },

    // --- PUSH NOTIFICATION SETUP ---
    async requestForToken(userId: string) {
        if (!messaging) {
            console.log("Firebase Messaging not initialized, skipping token request.");
            return null;
        }
        try {
            const currentToken = await getToken(messaging, {
                vapidKey: 'BKyLLG7KP2OvqHg7sgXG_kj8VEY25ru_rbhFZkVT76o1M1-0SGxGC85O69YdxEZtp_8BLxW7-IrnCWOoOZZ7JHs'
            });

            if (currentToken) {
                // Save token to database
                await this.saveTokenToDatabase(userId, currentToken);
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return null;
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            return null;
        }
    },

    async saveTokenToDatabase(userId: string, token: string) {
        try {
            // We use setDoc with merge to avoid overwriting other user data
            // Storing in a subcollection 'fcmTokens' is cleaner if user has multiple devices
            // But for simple query, let's store in a 'fcmTokens' array field or subcollection.
            // Let's use a subcollection 'devices' where doc ID is the token, so we can handle multiple easily.
            const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
            await setDoc(tokenRef, {
                token: token,
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
                platform: 'web'
            });
        } catch (err) {
            console.error("Error saving FCM token:", err);
        }
    },

    // Listen for foreground messages
    onMessageListener() {
        return new Promise((resolve) => {
            if (!messaging) {
                return resolve(null);
            }
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        });
    }
};
