/**
 * Mention notification utilities for Cloud Functions
 * Handles creating mention documents and Firestore notifications
 */

import * as admin from 'firebase-admin';

const MAX_MENTIONS_PER_POST = 10;

/**
 * Process mentions for a post or comment
 * @param mentionedUids Array of user UIDs that were mentioned
 * @param authorUid UID of the user who created the post/comment
 * @param authorData Author information
 * @param contentData Content information
 * @param existingMentionUids Previously mentioned UIDs (for updates)
 */
export async function processMentions(
    mentionedUids: string[],
    authorUid: string,
    authorData: {
        username: string;
        displayName: string;
        photoURL: string | null;
    },
    contentData: {
        type: 'post' | 'comment';
        postId: string;
        commentId?: string;
        text: string;
    },
    existingMentionUids: string[] = []
): Promise<void> {
    const db = admin.firestore();

    // Rate limiting: max 10 mentions per post/comment
    if (mentionedUids.length > MAX_MENTIONS_PER_POST) {
        console.warn(`Too many mentions (${mentionedUids.length}), limiting to ${MAX_MENTIONS_PER_POST}`);
        mentionedUids = mentionedUids.slice(0, MAX_MENTIONS_PER_POST);
    }

    // Filter out self-mentions and already-notified users
    const newMentionUids = mentionedUids.filter(uid =>
        uid !== authorUid && !existingMentionUids.includes(uid)
    );

    if (newMentionUids.length === 0) {
        console.log('No new mentions to process');
        return;
    }

    console.log(`Processing ${newMentionUids.length} new mentions`);

    // Create mention documents and notifications
    const batch = db.batch();

    for (const mentionedUid of newMentionUids) {
        // Create mention document in users/{uid}/mentions
        const mentionRef = db.collection('users').doc(mentionedUid).collection('mentions').doc();
        const mentionData = {
            type: contentData.type,
            postId: contentData.postId,
            commentId: contentData.commentId || null,
            fromUid: authorUid,
            fromUsername: authorData.username,
            fromDisplayName: authorData.displayName,
            fromAvatar: authorData.photoURL || '',
            text: contentData.text.substring(0, 100), // Preview
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        };
        batch.set(mentionRef, mentionData);

        // Create Firestore notification (matches existing notification system)
        const notificationRef = db.collection('users').doc(mentionedUid).collection('notifications').doc();
        const link = contentData.commentId
            ? `/post/${contentData.postId}#comment-${contentData.commentId}`
            : `/post/${contentData.postId}`;
        const preview = contentData.text.substring(0, 100);
        const contentLabel = contentData.type === 'post' ? 'post' : 'comment';

        const notificationData = {
            type: 'mention',
            title: 'You were mentioned',
            body: `${authorData.displayName} mentioned you in a ${contentLabel}: "${preview}${contentData.text.length > 100 ? '...' : ''}"`,
            link: link,
            data: {
                postId: contentData.postId,
                commentId: contentData.commentId || null,
                type: 'mention',
                contentType: contentData.type
            },
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        batch.set(notificationRef, notificationData);
    }

    // Commit batch write
    await batch.commit();
    console.log(`Created ${newMentionUids.length} mention documents and notifications`);
}

/**
 * Delete mention documents when a post/comment is deleted
 */
export async function deleteMentions(
    postId: string,
    commentId?: string
): Promise<void> {
    const db = admin.firestore();

    // Query all mentions for this post/comment
    let query = db.collectionGroup('mentions')
        .where('postId', '==', postId);

    if (commentId) {
        query = query.where('commentId', '==', commentId);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
        console.log('No mentions to delete');
        return;
    }

    // Delete in batches
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} mention documents`);
}
