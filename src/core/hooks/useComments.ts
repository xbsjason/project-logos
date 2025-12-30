import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
    Timestamp
} from 'firebase/firestore';
import type { Comment } from '../types';

interface CommentNode extends Comment {
    replies: CommentNode[];
}

interface UseCommentsReturn {
    comments: CommentNode[];
    loading: boolean;
    error: string | null;
    addComment: (text: string, userId: string, username: string, userAvatar: string, parentId?: string | null, mediaUrl?: string, mediaType?: 'image' | 'gif') => Promise<void>;
    toggleLike: (commentId: string, userId: string, isLiked: boolean) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    updateComment: (commentId: string, text: string) => Promise<void>;
    reportComment: (commentId: string, userId: string, reason: string) => Promise<void>;
    flatComments: Comment[]; // For virtualization
}

/**
 * Custom hook for managing comments with client-side threading.
 * 
 * This hook:
 * - Subscribes to a flat Firestore collection of comments
 * - Builds a tree structure for rendering nested replies
 * - Provides optimistic updates for likes and new comments
 * - Returns both flat and tree structures for different rendering strategies
 */
export function useComments(postId: string): UseCommentsReturn {
    const [flatComments, setFlatComments] = useState<Comment[]>([]);
    const [comments, setComments] = useState<CommentNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Build comment tree from flat list
    const buildCommentTree = useCallback((flatList: Comment[]): CommentNode[] => {
        const commentMap = new Map<string, CommentNode>();
        const rootComments: CommentNode[] = [];

        // First pass: create all nodes
        flatList.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: build tree structure
        flatList.forEach(comment => {
            const node = commentMap.get(comment.id)!;
            if (comment.parentId === null) {
                // Root comment
                rootComments.push(node);
            } else {
                // Reply - add to parent
                const parent = commentMap.get(comment.parentId);
                if (parent) {
                    parent.replies.push(node);
                } else {
                    // Parent not found, treat as root
                    rootComments.push(node);
                }
            }
        });

        return rootComments;
    }, []);

    // Subscribe to comments
    useEffect(() => {
        if (!postId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedComments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Comment));

                setFlatComments(fetchedComments);
                setComments(buildCommentTree(fetchedComments));
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching comments:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [postId, buildCommentTree]);

    /**
     * Add a new comment or reply with optimistic update
     */
    const addComment = useCallback(async (
        text: string,
        userId: string,
        username: string,
        userAvatar: string,
        parentId: string | null = null,
        mediaUrl?: string,
        mediaType?: 'image' | 'gif'
    ) => {
        if (!postId || !text.trim()) return;

        // Create optimistic comment
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            parentId,
            text: text.trim(),
            userId,
            username,
            userAvatar,
            createdAt: Timestamp.now(),
            likeCount: 0,
            replyCount: 0,
            likedBy: [],
            mediaUrl,
            mediaType
        };

        // Optimistic update
        setFlatComments(prev => [...prev, optimisticComment]);
        setComments(buildCommentTree([...flatComments, optimisticComment]));

        try {
            // Add to Firestore
            const docRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
                parentId,
                text: text.trim(),
                userId,
                username,
                userAvatar,
                createdAt: serverTimestamp(),
                likeCount: 0,
                replyCount: 0,
                likedBy: [],
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null
            });

            // If this is a reply, increment parent's reply count
            if (parentId) {
                const parentRef = doc(db, 'posts', postId, 'comments', parentId);
                await updateDoc(parentRef, {
                    replyCount: increment(1)
                });
            }

            // Update post's comment count
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                comments: increment(1)
            });

            console.log('Comment added:', docRef.id);
        } catch (err) {
            console.error('Error adding comment:', err);
            // Revert optimistic update on error
            setFlatComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            setComments(buildCommentTree(flatComments));
            throw err;
        }
    }, [postId, flatComments, buildCommentTree]);

    /**
     * Toggle like on a comment with optimistic update
     */
    const toggleLike = useCallback(async (
        commentId: string,
        userId: string,
        isLiked: boolean
    ) => {
        if (!postId) return;

        // Optimistic update
        setFlatComments(prevComments => prevComments.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    likeCount: c.likeCount + (isLiked ? -1 : 1),
                    likedBy: isLiked
                        ? (c.likedBy || []).filter(id => id !== userId)
                        : [...(c.likedBy || []), userId]
                };
            }
            return c;
        }));

        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            await updateDoc(commentRef, {
                likeCount: increment(isLiked ? -1 : 1),
                likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
            });
        } catch (err) {
            console.error('Error toggling like:', err);
            // Revert optimistic update on error
            setFlatComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        likeCount: c.likeCount + (isLiked ? 1 : -1),
                        likedBy: isLiked
                            ? [...(c.likedBy || []), userId]
                            : (c.likedBy || []).filter(id => id !== userId)
                    };
                }
                return c;
            }));
        }
    }, [postId]);

    /**
     * Delete a comment (soft delete)
     */
    const deleteComment = useCallback(async (commentId: string) => {
        if (!postId) return;

        // Optimistic update - mark as deleted
        setFlatComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, isDeleted: true, text: '[Comment deleted]' } : c
        ));

        // Rebuild tree to reflect deletion
        setComments(buildCommentTree(flatComments.map(c =>
            c.id === commentId ? { ...c, isDeleted: true, text: '[Comment deleted]' } : c
        )));

        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            await updateDoc(commentRef, {
                isDeleted: true,
                text: '[Comment deleted]',
                mediaUrl: null,
                mediaType: null
            });
        } catch (err) {
            console.error('Error deleting comment:', err);
            // Revert
            // Note: In a real app we'd need the original text to revert properly, 
            // but since we're fetching live data, the snapshot listener will eventually fix it.
        }
    }, [postId, flatComments, buildCommentTree]);

    /**
     * Update a comment text
     */
    const updateComment = useCallback(async (commentId: string, newText: string) => {
        if (!postId || !newText.trim()) return;

        // Optimistic update
        setFlatComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, text: newText, isEdited: true } : c
        ));

        setComments(buildCommentTree(flatComments.map(c =>
            c.id === commentId ? { ...c, text: newText, isEdited: true } : c
        )));

        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            await updateDoc(commentRef, {
                text: newText,
                isEdited: true
            });
        } catch (err) {
            console.error('Error updating comment:', err);
        }
    }, [postId, flatComments, buildCommentTree]);

    /**
     * Report a comment
     */
    const reportComment = useCallback(async (commentId: string, userId: string, reason: string) => {
        if (!postId) return;

        // Optimistic update - add user to reports array
        setFlatComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, reports: [...(c.reports || []), userId] } : c
        ));

        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            await updateDoc(commentRef, {
                reports: arrayUnion(userId)
            });

            // Create separate report document for admin review
            await addDoc(collection(db, 'reports'), {
                targetId: commentId,
                targetType: 'comment',
                postId,
                reportedBy: userId,
                reason,
                createdAt: serverTimestamp(),
                status: 'pending'
            });
        } catch (err) {
            console.error('Error reporting comment:', err);
        }
    }, [postId]);

    return {
        comments,
        flatComments,
        loading,
        error,
        addComment,
        toggleLike,
        deleteComment,
        updateComment,
        reportComment
    };
}
