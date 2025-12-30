"use strict";
/**
 * Cloud Functions for FaithVoice
 * Handles mentions, hashtags, and notifications
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
exports.onCommentDelete = exports.onCommentUpdate = exports.onCommentCreate = exports.onPostDelete = exports.onPostUpdate = exports.onPostCreate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const parsing_1 = require("./parsing");
const tags_1 = require("./tags");
const mentions_1 = require("./mentions");
// Initialize Firebase Admin
admin.initializeApp();
/**
 * Triggered when a post is created
 * Parses mentions and hashtags, updates indexes, sends notifications
 */
exports.onPostCreate = functions.firestore
    .document('posts/{postId}')
    .onCreate(async (snapshot, context) => {
    var _a, _b, _c, _d, _e;
    const postId = context.params.postId;
    const postData = snapshot.data();
    console.log(`Processing new post: ${postId}`);
    try {
        // Parse text for mentions and hashtags
        const text = postData.content || postData.caption || '';
        const { mentions, hashtags } = (0, parsing_1.parseTextEntities)(text);
        console.log(`Found ${mentions.length} mentions and ${hashtags.length} hashtags`);
        // Resolve usernames to UIDs
        const usernameToUid = await (0, parsing_1.resolveUsernames)(mentions, admin.firestore());
        const mentionUids = Array.from(usernameToUid.values());
        // Update post document with resolved mentions and hashtags
        await snapshot.ref.update({
            mentionUids: mentionUids,
            hashtags: hashtags
        });
        // Update tag index
        if (hashtags.length > 0) {
            await (0, tags_1.updateTagIndex)(postId, hashtags, [], {
                authorId: postData.authorId,
                postType: postData.type,
                caption: postData.caption || postData.content,
                mediaUrl: postData.mediaUrl,
                authorName: (_a = postData.author) === null || _a === void 0 ? void 0 : _a.name,
                authorAvatar: (_b = postData.author) === null || _b === void 0 ? void 0 : _b.avatar,
                createdAt: postData.createdAt
            });
        }
        // Process mentions and send notifications
        if (mentionUids.length > 0) {
            await (0, mentions_1.processMentions)(mentionUids, postData.authorId, {
                username: ((_c = postData.author) === null || _c === void 0 ? void 0 : _c.username) || postData.authorId,
                displayName: ((_d = postData.author) === null || _d === void 0 ? void 0 : _d.name) || 'Someone',
                photoURL: ((_e = postData.author) === null || _e === void 0 ? void 0 : _e.avatar) || null
            }, {
                type: 'post',
                postId: postId,
                text: text
            });
        }
        console.log(`Successfully processed post ${postId}`);
    }
    catch (error) {
        console.error(`Error processing post ${postId}:`, error);
    }
});
/**
 * Triggered when a post is updated
 * Updates mentions and hashtags if text changed
 */
exports.onPostUpdate = functions.firestore
    .document('posts/{postId}')
    .onUpdate(async (change, context) => {
    var _a, _b, _c, _d, _e;
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
        const { mentions, hashtags } = (0, parsing_1.parseTextEntities)(afterText);
        // Resolve usernames
        const usernameToUid = await (0, parsing_1.resolveUsernames)(mentions, admin.firestore());
        const newMentionUids = Array.from(usernameToUid.values());
        const oldMentionUids = beforeData.mentionUids || [];
        const oldHashtags = beforeData.hashtags || [];
        // Update post document
        await change.after.ref.update({
            mentionUids: newMentionUids,
            hashtags: hashtags
        });
        // Update tag index
        await (0, tags_1.updateTagIndex)(postId, hashtags, oldHashtags, {
            authorId: afterData.authorId,
            postType: afterData.type,
            caption: afterData.caption || afterData.content,
            mediaUrl: afterData.mediaUrl,
            authorName: (_a = afterData.author) === null || _a === void 0 ? void 0 : _a.name,
            authorAvatar: (_b = afterData.author) === null || _b === void 0 ? void 0 : _b.avatar,
            createdAt: afterData.createdAt
        });
        // Process only NEW mentions (don't re-notify existing ones)
        await (0, mentions_1.processMentions)(newMentionUids, afterData.authorId, {
            username: ((_c = afterData.author) === null || _c === void 0 ? void 0 : _c.username) || afterData.authorId,
            displayName: ((_d = afterData.author) === null || _d === void 0 ? void 0 : _d.name) || 'Someone',
            photoURL: ((_e = afterData.author) === null || _e === void 0 ? void 0 : _e.avatar) || null
        }, {
            type: 'post',
            postId: postId,
            text: afterText
        }, oldMentionUids // Pass existing mentions to avoid duplicates
        );
        console.log(`Successfully updated post ${postId}`);
    }
    catch (error) {
        console.error(`Error updating post ${postId}:`, error);
    }
});
/**
 * Triggered when a post is deleted
 * Cleans up tag indexes and mention documents
 */
exports.onPostDelete = functions.firestore
    .document('posts/{postId}')
    .onDelete(async (snapshot, context) => {
    const postId = context.params.postId;
    const postData = snapshot.data();
    console.log(`Cleaning up deleted post: ${postId}`);
    try {
        // Remove from tag indexes
        const hashtags = postData.hashtags || [];
        if (hashtags.length > 0) {
            await (0, tags_1.removeFromTagIndex)(postId, hashtags);
        }
        // Delete mention documents
        await (0, mentions_1.deleteMentions)(postId);
        console.log(`Successfully cleaned up post ${postId}`);
    }
    catch (error) {
        console.error(`Error cleaning up post ${postId}:`, error);
    }
});
/**
 * Triggered when a comment is created
 * Parses mentions and hashtags, sends notifications
 */
exports.onCommentCreate = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onCreate(async (snapshot, context) => {
    const postId = context.params.postId;
    const commentId = context.params.commentId;
    const commentData = snapshot.data();
    console.log(`Processing new comment: ${commentId} on post ${postId}`);
    try {
        const text = commentData.text || '';
        const { mentions, hashtags } = (0, parsing_1.parseTextEntities)(text);
        console.log(`Found ${mentions.length} mentions and ${hashtags.length} hashtags in comment`);
        // Resolve usernames
        const usernameToUid = await (0, parsing_1.resolveUsernames)(mentions, admin.firestore());
        const mentionUids = Array.from(usernameToUid.values());
        // Update comment document
        await snapshot.ref.update({
            mentionUids: mentionUids,
            hashtags: hashtags
        });
        // Update tag index for comments
        if (hashtags.length > 0) {
            await (0, tags_1.updateCommentTagIndex)(postId, commentId, hashtags, [], {
                authorId: commentData.userId,
                text: text,
                createdAt: commentData.createdAt
            });
        }
        // Process mentions
        if (mentionUids.length > 0) {
            await (0, mentions_1.processMentions)(mentionUids, commentData.userId, {
                username: commentData.username || commentData.userId,
                displayName: commentData.userDisplayName || 'Someone',
                photoURL: commentData.userAvatar || null
            }, {
                type: 'comment',
                postId: postId,
                commentId: commentId,
                text: text
            });
        }
        console.log(`Successfully processed comment ${commentId}`);
    }
    catch (error) {
        console.error(`Error processing comment ${commentId}:`, error);
    }
});
/**
 * Triggered when a comment is updated
 * Updates mentions and hashtags if text changed
 */
exports.onCommentUpdate = functions.firestore
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
        const { mentions, hashtags } = (0, parsing_1.parseTextEntities)(afterText);
        // Resolve usernames
        const usernameToUid = await (0, parsing_1.resolveUsernames)(mentions, admin.firestore());
        const newMentionUids = Array.from(usernameToUid.values());
        const oldMentionUids = beforeData.mentionUids || [];
        const oldHashtags = beforeData.hashtags || [];
        // Update comment document
        await change.after.ref.update({
            mentionUids: newMentionUids,
            hashtags: hashtags
        });
        // Update tag index
        await (0, tags_1.updateCommentTagIndex)(postId, commentId, hashtags, oldHashtags, {
            authorId: afterData.userId,
            text: afterText,
            createdAt: afterData.createdAt
        });
        // Process only NEW mentions
        await (0, mentions_1.processMentions)(newMentionUids, afterData.userId, {
            username: afterData.username || afterData.userId,
            displayName: afterData.userDisplayName || 'Someone',
            photoURL: afterData.userAvatar || null
        }, {
            type: 'comment',
            postId: postId,
            commentId: commentId,
            text: afterText
        }, oldMentionUids);
        console.log(`Successfully updated comment ${commentId}`);
    }
    catch (error) {
        console.error(`Error updating comment ${commentId}:`, error);
    }
});
/**
 * Triggered when a comment is deleted
 * Cleans up tag indexes and mention documents
 */
exports.onCommentDelete = functions.firestore
    .document('posts/{postId}/comments/{commentId}')
    .onDelete(async (snapshot, context) => {
    const postId = context.params.postId;
    const commentId = context.params.commentId;
    console.log(`Cleaning up deleted comment: ${commentId}`);
    try {
        // Delete mention documents
        await (0, mentions_1.deleteMentions)(postId, commentId);
        console.log(`Successfully cleaned up comment ${commentId}`);
    }
    catch (error) {
        console.error(`Error cleaning up comment ${commentId}:`, error);
    }
});
//# sourceMappingURL=index.js.map