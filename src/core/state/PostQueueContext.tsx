import React, { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext'; // Assuming ToastContext is available
import { DraftsService } from '../services/DraftsService'; // You'll need to create this service
import type { Draft } from '../services/DraftsService';
import { db, storage } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import type { PostType } from '../data/mockData';

// Define the payload expected for a new post
export interface PostPayload {
    id: string; // Pre-generated ID
    authorId: string;
    author: {
        name: string;
        avatar: string | null;
        username: string;
    };
    type: PostType;
    content: string; // Text or caption
    mediaFile: File | null;
    verseData?: { ref: string; text: string; id?: string };
    song?: {
        title: string;
        artist: string;
        coverUrl?: string;
        audioUrl?: string;
    };
    tags: string[];
    mentions: string[];
    visibility: 'public' | 'private';
    background?: string;
    nextPath?: string; // Optional path to redirect to after posting
    aspectRatio?: string; // "1:1" | "16:9" | "9:16" | "4:5"
    sharedMoment?: {
        momentId: string;
        title: string;
        verseQuote: string;
        verseRef: string;
    };
}

interface PostQueueContextType {
    queuePost: (payload: PostPayload) => void;
    isUploading: boolean;
}

const PostQueueContext = createContext<PostQueueContextType | undefined>(undefined);

export function PostQueueProvider({ children }: { children: React.ReactNode }) {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);

    const queuePost = async (payload: PostPayload) => {
        // 1. Optimistic Feedback
        showToast('Posting...', 'info');

        // Clear scroll position so user sees their new post at the top
        sessionStorage.removeItem('home_feed_scroll');

        // Dynamic Navigation: Support Return to Origin
        if (payload.nextPath) {
            navigate(payload.nextPath);
        } else {
            navigate('/'); // Default to Feed
        }

        setIsUploading(true);

        try {
            // 2. Perform Uploads (Background)
            let mediaUrl = null;
            let thumbnailUrl = null;
            const isVideo = payload.mediaFile?.type.startsWith('video/');

            if (payload.mediaFile) {
                console.log(`[PostQueue] Starting upload. Type: ${payload.mediaFile.type}, Size: ${payload.mediaFile.size} bytes`);

                // Ensure unique path for verse_art to prevent caching issues or overwrites if ID is reused (unlikely but safe)
                const fileName = payload.type === 'verse_art' ? `verse_art_${Date.now()}.png` : 'original';
                const path = `posts/${payload.authorId}/${payload.id}/${fileName}`;
                const storageRef = ref(storage, path);

                try {
                    const metadata = {
                        contentType: payload.mediaFile.type
                    };
                    const uploadResult = await uploadBytes(storageRef, payload.mediaFile, metadata);
                    console.log('[PostQueue] Upload bytes success:', uploadResult);

                    mediaUrl = await getDownloadURL(storageRef);
                    console.log(`[PostQueue] Download URL retrieved: ${mediaUrl}`);
                } catch (uploadError) {
                    console.error('[PostQueue] Upload failed:', uploadError);
                    throw uploadError; // Re-throw to trigger fallback
                }
            } else if (payload.type === 'verse_art') {
                console.warn('[PostQueue] Verse Art post queued but no mediaFile provided!');
            }

            // 3. Write to Firestore
            const postRef = doc(db, 'posts', payload.id);

            // Normalize content
            // If Text Post: content = text, caption = ''
            // If Media Post: content = url, caption = text
            // If Verse Art: content = url, caption = text
            let finalContent = payload.content;
            let finalCaption = '';

            if (payload.type === 'verse_art' && payload.mediaFile) {
                if (!mediaUrl) {
                    console.error('[PostQueue] Verse Art error: No media URL generated.');
                }
                finalContent = mediaUrl || '';
                finalCaption = payload.content;
            } else {
                // Text/Prayer/Praise post (even with media)
                // Content stays as the main text. MediaUrl is supplementary.
                finalContent = payload.content;
                finalCaption = ''; // Or we can support caption if we want, but usually 'content' is the body.
            }

            console.log('[PostQueue] Writing to Firestore:', { id: payload.id, type: payload.type, contentLen: finalContent.length });

            await setDoc(postRef, {
                id: payload.id,
                authorId: payload.authorId,
                author: payload.author,
                type: payload.type, // 'verse_art', 'thought', etc.
                content: finalContent,
                caption: finalCaption,
                tags: payload.tags,
                mentions: payload.mentions,
                visibility: payload.visibility,
                background: payload.background || null,
                aspectRatio: payload.aspectRatio || null,

                // Detailed Media Fields
                mediaUrl: mediaUrl,
                thumbnailUrl: thumbnailUrl,
                isVideo: !!isVideo,

                // Metadata
                song: payload.song || null,
                verse: payload.verseData ? {
                    ref: payload.verseData.ref,
                    text: payload.verseData.text,
                    id: payload.verseData.id
                } : undefined,

                sharedMoment: payload.sharedMoment,

                // Metrics
                likes: 0,
                comments: 0,
                shares: 0,
                prayerCount: 0,
                prayedBy: {},
                createdAt: serverTimestamp()
            });

            // 4. Success Feedback
            showToast('Posted successfully', 'success');

        } catch (error: any) {
            console.error('Post failed with error:', error);
            console.error('Failure Details:', {
                message: error.message,
                code: error.code, // Firebase errors often have codes
                payloadId: payload.id
            });

            // 5. Fallback: Save to Drafts
            try {
                const draft: Draft = {
                    id: payload.id,
                    type: payload.type,
                    content: payload.content,
                    mediaFile: payload.mediaFile || undefined,
                    verseData: payload.verseData,
                    song: payload.song,
                    updatedAt: Date.now()
                };

                await DraftsService.saveDraft(draft);
                showToast('Upload failed. Saved to drafts.', 'error');
            } catch (draftError) {
                console.error('Failed to save draft:', draftError);
                showToast('Upload failed and could not save draft.', 'error');
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <PostQueueContext.Provider value={{ queuePost, isUploading }}>
            {children}
        </PostQueueContext.Provider>
    );
}

export function usePostQueue() {
    const context = useContext(PostQueueContext);
    if (!context) {
        throw new Error('usePostQueue must be used within a PostQueueProvider');
    }
    return context;
}
