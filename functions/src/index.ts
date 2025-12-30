/**
 * Cloud Functions for FaithVoice
 * Handles mentions, hashtags, and notifications
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { parseTextEntities, resolveUsernames } from './parsing';
import { updateTagIndex, removeFromTagIndex, updateCommentTagIndex } from './tags';
import { processMentions, deleteMentions } from './mentions';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Triggered when a post is created
 * Parses mentions and hashtags, updates indexes, sends notifications
 */
export const onPostCreate = functions.firestore
    .document('posts/{postId}')
    .onCreate(async (snapshot, context) => {
        const postId = context.params.postId;
        const postData = snapshot.data();

        console.log(`Processing new post: ${postId}`);

        try {
            // Parse text for mentions and hashtags
            const text = postData.content || postData.caption || '';
            const { mentions, hashtags } = parseTextEntities(text);

            console.log(`Found ${mentions.length} mentions and ${hashtags.length} hashtags`);

            // Resolve usernames to UIDs
            const usernameToUid = await resolveUsernames(mentions, admin.firestore());
            const mentionUids = Array.from(usernameToUid.values());

            // Update post document with resolved mentions and hashtags
            await snapshot.ref.update({
                mentionUids: mentionUids,
                hashtags: hashtags
            });

            // Update tag index
            if (hashtags.length > 0) {
                await updateTagIndex(
                    postId,
                    hashtags,
                    [],
                    {
                        authorId: postData.authorId,
                        postType: postData.type,
                        caption: postData.caption || postData.content,
                        mediaUrl: postData.mediaUrl,
                        authorName: postData.author?.name,
                        authorAvatar: postData.author?.avatar,
                        createdAt: postData.createdAt
                    }
                );
            }

            // Process mentions and send notifications
            if (mentionUids.length > 0) {
                await processMentions(
                    mentionUids,
                    postData.authorId,
                    {
                        username: postData.author?.username || postData.authorId,
                        displayName: postData.author?.name || 'Someone',
                        photoURL: postData.author?.avatar || null
                    },
                    {
                        type: 'post',
                        postId: postId,
                        text: text
                    }
                );
            }

            console.log(`Successfully processed post ${postId}`);
        } catch (error) {
            console.error(`Error processing post ${postId}:`, error);
        }
    });

/**
 * Triggered when a post is updated
 * Updates mentions and hashtags if text changed
 */
export const onPostUpdate = functions.firestore
    .document('posts/{postId}')
    .onUpdate(async (change, context) => {
        const postId = context.params.postId;
        const beforeData = change.before.data();
        const afterData = change.after.data();

        const beforeText = beforeData.content || beforeData.caption || '';
        const afterText = afterData.content || afterData.caption || '';

        // Only process if text changed
        if (beforeText === afterText) {
            console.log(`Post ${postId} updated but text unchanged, skipping`);
            return;
        }

        console.log(`Processing updated post: ${postId}`);

        try {
            // Parse new text
            const { mentions, hashtags } = parseTextEntities(afterText);

            // Resolve usernames
            const usernameToUid = await resolveUsernames(mentions, admin.firestore());
            const newMentionUids = Array.from(usernameToUid.values());
            const oldMentionUids = beforeData.mentionUids || [];
            const oldHashtags = beforeData.hashtags || [];

            // Update post document
            await change.after.ref.update({
                mentionUids: newMentionUids,
                hashtags: hashtags
            });

            // Update tag index
            await updateTagIndex(
                postId,
                hashtags,
                oldHashtags,
                {
                    authorId: afterData.authorId,
                    postType: afterData.type,
                    caption: afterData.caption || afterData.content,
                    mediaUrl: afterData.mediaUrl,
                    authorName: afterData.author?.name,
                    authorAvatar: afterData.author?.avatar,
                    createdAt: afterData.createdAt
                }
            );

            // Process only NEW mentions (don't re-notify existing ones)
            await processMentions(
                newMentionUids,
                afterData.authorId,
                {
                    username: afterData.author?.username || afterData.authorId,
                    displayName: afterData.author?.name || 'Someone',
                    photoURL: afterData.author?.avatar || null
                },
                {
                    type: 'post',
                    postId: postId,
                    text: afterText
                },
                oldMentionUids // Pass existing mentions to avoid duplicates
            );

            console.log(`Successfully updated post ${postId}`);
        } catch (error) {
            console.error(`Error updating post ${postId}:`, error);
        }
    });

/**
 * Triggered when a post is deleted
 * Cleans up tag indexes and mention documents
 */
export const onPostDelete = functions.firestore
    .document('posts/{postId}')
    .onDelete(async (snapshot, context) => {
        const postId = context.params.postId;
        const postData = snapshot.data();

        console.log(`Cleaning up deleted post: ${postId}`);

        try {
            // Remove from tag indexes
            const hashtags = postData.hashtags || [];
            if (hashtags.length > 0) {
                await removeFromTagIndex(postId, hashtags);
            }

            // Delete mention documents
            await deleteMentions(postId);

            console.log(`Successfully cleaned up post ${postId}`);
        } catch (error) {
            console.error(`Error cleaning up post ${postId}:`, error);
        }
    });

/**
 * Triggered when a comment is created
 * Parses mentions and hashtags, sends notifications
 */
export const onCommentCreate = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snapshot, context) => {
        const postId = context.params.postId;
        const commentId = context.params.commentId;
        const commentData = snapshot.data();

        console.log(`Processing new comment: ${commentId} on post ${postId}`);

        try {
            const text = commentData.text || '';
            const { mentions, hashtags } = parseTextEntities(text);

            console.log(`Found ${mentions.length} mentions and ${hashtags.length} hashtags in comment`);

            // Resolve usernames
            const usernameToUid = await resolveUsernames(mentions, admin.firestore());
            const mentionUids = Array.from(usernameToUid.values());

            // Update comment document
            await snapshot.ref.update({
                mentionUids: mentionUids,
                hashtags: hashtags
            });

            // Update tag index for comments
            if (hashtags.length > 0) {
                await updateCommentTagIndex(
                    postId,
                    commentId,
                    hashtags,
                    [],
                    {
                        authorId: commentData.userId,
                        text: text,
                        createdAt: commentData.createdAt
                    }
                );
            }

            // Process mentions
            if (mentionUids.length > 0) {
                await processMentions(
                    mentionUids,
                    commentData.userId,
                    {
                        username: commentData.username || commentData.userId,
                        displayName: commentData.userDisplayName || 'Someone',
                        photoURL: commentData.userAvatar || null
                    },
                    {
                        type: 'comment',
                        postId: postId,
                        commentId: commentId,
                        text: text
                    }
                );
            }

            console.log(`Successfully processed comment ${commentId}`);
        } catch (error) {
            console.error(`Error processing comment ${commentId}:`, error);
        }
    });

/**
 * Triggered when a comment is updated
 * Updates mentions and hashtags if text changed
 */
export const onCommentUpdate = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onUpdate(async (change, context) => {
        const postId = context.params.postId;
        const commentId = context.params.commentId;
        const beforeData = change.before.data();
        const afterData = change.after.data();

        const beforeText = beforeData.text || '';
        const afterText = afterData.text || '';

        // Only process if text changed
        if (beforeText === afterText) {
            console.log(`Comment ${commentId} updated but text unchanged, skipping`);
            return;
        }

        console.log(`Processing updated comment: ${commentId}`);

        try {
            const { mentions, hashtags } = parseTextEntities(afterText);

            // Resolve usernames
            const usernameToUid = await resolveUsernames(mentions, admin.firestore());
            const newMentionUids = Array.from(usernameToUid.values());
            const oldMentionUids = beforeData.mentionUids || [];
            const oldHashtags = beforeData.hashtags || [];

            // Update comment document
            await change.after.ref.update({
                mentionUids: newMentionUids,
                hashtags: hashtags
            });

            // Update tag index
            await updateCommentTagIndex(
                postId,
                commentId,
                hashtags,
                oldHashtags,
                {
                    authorId: afterData.userId,
                    text: afterText,
                    createdAt: afterData.createdAt
                }
            );

            // Process only NEW mentions
            await processMentions(
                newMentionUids,
                afterData.userId,
                {
                    username: afterData.username || afterData.userId,
                    displayName: afterData.userDisplayName || 'Someone',
                    photoURL: afterData.userAvatar || null
                },
                {
                    type: 'comment',
                    postId: postId,
                    commentId: commentId,
                    text: afterText
                },
                oldMentionUids
            );

            console.log(`Successfully updated comment ${commentId}`);
        } catch (error) {
            console.error(`Error updating comment ${commentId}:`, error);
        }
    });

/**
 * Triggered when a comment is deleted
 * Cleans up tag indexes and mention documents
 */
export const onCommentDelete = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onDelete(async (snapshot, context) => {
        const postId = context.params.postId;
        const commentId = context.params.commentId;

        console.log(`Cleaning up deleted comment: ${commentId}`);

        try {
            // Delete mention documents
            await deleteMentions(postId, commentId);

            console.log(`Successfully cleaned up comment ${commentId}`);
        } catch (error) {
            console.error(`Error cleaning up comment ${commentId}:`, error);
        }
    });
