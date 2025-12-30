/**
 * Tag indexing utilities for Cloud Functions
 * Manages the tags/{tag}/posts/{postId} collection
 */

import * as admin from 'firebase-admin';

/**
 * Update tag index for a post
 * @param postId Post ID
 * @param newHashtags New hashtags from the post
 * @param oldHashtags Previous hashtags (for updates)
 * @param postData Post metadata to store in index
 */
export async function updateTagIndex(
    postId: string,
    newHashtags: string[],
    oldHashtags: string[] = [],
    postData: {
        authorId: string;
        postType: string;
        caption?: string;
        mediaUrl?: string;
        authorName?: string;
        authorAvatar?: string;
        createdAt: admin.firestore.Timestamp;
    }
): Promise<void> {
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
            caption: postData.caption?.substring(0, 200), // Store preview
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
export async function removeFromTagIndex(
    postId: string,
    hashtags: string[]
): Promise<void> {
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
export async function updateCommentTagIndex(
    postId: string,
    commentId: string,
    newHashtags: string[],
    oldHashtags: string[] = [],
    commentData: {
        authorId: string;
        text: string;
        createdAt: admin.firestore.Timestamp;
    }
): Promise<void> {
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
