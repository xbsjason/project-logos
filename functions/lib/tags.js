"use strict";
/**
 * Tag indexing utilities for Cloud Functions
 * Manages the tags/{tag}/posts/{postId} collection
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
exports.updateTagIndex = updateTagIndex;
exports.removeFromTagIndex = removeFromTagIndex;
exports.updateCommentTagIndex = updateCommentTagIndex;
const admin = __importStar(require("firebase-admin"));
/**
 * Update tag index for a post
 * @param postId Post ID
 * @param newHashtags New hashtags from the post
 * @param oldHashtags Previous hashtags (for updates)
 * @param postData Post metadata to store in index
 */
async function updateTagIndex(postId, newHashtags, oldHashtags = [], postData) {
    var _a;
    const db = admin.firestore();
    const batch = db.batch();
    // Determine which tags to add and remove
    const tagsToAdd = newHashtags.filter(tag => !oldHashtags.includes(tag));
    const tagsToRemove = oldHashtags.filter(tag => !newHashtags.includes(tag));
    // Add new tags
    for (const tag of tagsToAdd) {
        const tagPostRef = db.collection('tags').doc(tag).collection('posts').doc(postId);
        batch.set(tagPostRef, {
            createdAt: postData.createdAt,
            authorId: postData.authorId,
            postType: postData.postType,
            caption: (_a = postData.caption) === null || _a === void 0 ? void 0 : _a.substring(0, 200), // Store preview
            mediaUrl: postData.mediaUrl,
            authorName: postData.authorName,
            authorAvatar: postData.authorAvatar
        });
    }
    // Remove old tags
    for (const tag of tagsToRemove) {
        const tagPostRef = db.collection('tags').doc(tag).collection('posts').doc(postId);
        batch.delete(tagPostRef);
    }
    await batch.commit();
    console.log(`Updated tag index for post ${postId}: +${tagsToAdd.length} -${tagsToRemove.length}`);
}
/**
 * Remove post from all tag indexes
 * @param postId Post ID
 * @param hashtags Hashtags to remove from
 */
async function removeFromTagIndex(postId, hashtags) {
    const db = admin.firestore();
    const batch = db.batch();
    for (const tag of hashtags) {
        const tagPostRef = db.collection('tags').doc(tag).collection('posts').doc(postId);
        batch.delete(tagPostRef);
    }
    await batch.commit();
    console.log(`Removed post ${postId} from ${hashtags.length} tag indexes`);
}
/**
 * Update tag index for a comment
 * Similar to posts but stores in a separate collection for comments
 */
async function updateCommentTagIndex(postId, commentId, newHashtags, oldHashtags = [], commentData) {
    const db = admin.firestore();
    const batch = db.batch();
    const tagsToAdd = newHashtags.filter(tag => !oldHashtags.includes(tag));
    const tagsToRemove = oldHashtags.filter(tag => !newHashtags.includes(tag));
    // Add new tags
    for (const tag of tagsToAdd) {
        const tagCommentRef = db.collection('tags').doc(tag).collection('comments').doc(commentId);
        batch.set(tagCommentRef, {
            postId: postId,
            createdAt: commentData.createdAt,
            authorId: commentData.authorId,
            text: commentData.text.substring(0, 100) // Store preview
        });
    }
    // Remove old tags
    for (const tag of tagsToRemove) {
        const tagCommentRef = db.collection('tags').doc(tag).collection('comments').doc(commentId);
        batch.delete(tagCommentRef);
    }
    await batch.commit();
    console.log(`Updated tag index for comment ${commentId}: +${tagsToAdd.length} -${tagsToRemove.length}`);
}
//# sourceMappingURL=tags.js.map