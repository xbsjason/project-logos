"use strict";
/**
 * Mention notification utilities for Cloud Functions
 * Handles creating mention documents and Firestore notifications
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMentions = processMentions;
exports.deleteMentions = deleteMentions;
const admin = __importStar(require("firebase-admin"));
const MAX_MENTIONS_PER_POST = 10;
/**
 * Process mentions for a post or comment
 * @param mentionedUids Array of user UIDs that were mentioned
 * @param authorUid UID of the user who created the post/comment
 * @param authorData Author information
 * @param contentData Content information
 * @param existingMentionUids Previously mentioned UIDs (for updates)
 */
async function processMentions(mentionedUids, authorUid, authorData, contentData, existingMentionUids = []) {
    const db = admin.firestore();
    // Rate limiting: max 10 mentions per post/comment
    if (mentionedUids.length > MAX_MENTIONS_PER_POST) {
        console.warn(`Too many mentions (${mentionedUids.length}), limiting to ${MAX_MENTIONS_PER_POST}`);
        mentionedUids = mentionedUids.slice(0, MAX_MENTIONS_PER_POST);
    }
    // Filter out self-mentions and already-notified users
    const newMentionUids = mentionedUids.filter(uid => uid !== authorUid && !existingMentionUids.includes(uid));
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
async function deleteMentions(postId, commentId) {
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
//# sourceMappingURL=mentions.js.map