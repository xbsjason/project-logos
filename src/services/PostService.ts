import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc,
    where,
    startAfter,
    DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { Post } from '../data/mockData'; // We'll eventually move Post type to types folder

export const PostService = {
    // Fetch main feed posts
    async getFeedPosts(lastDoc?: DocumentSnapshot, limitCount = 20): Promise<{ posts: Post[], lastDoc: DocumentSnapshot | null }> {
        try {
            let q = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            if (lastDoc) {
                q = query(
                    collection(db, 'posts'),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(limitCount)
                );
            }

            const snapshot = await getDocs(q);
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

            return {
                posts,
                lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
            };
        } catch (error) {
            console.error("Error fetching feed:", error);
            return { posts: [], lastDoc: null };
        }
    },

    // Get single post
    async getPost(postId: string): Promise<Post | null> {
        try {
            const docRef = doc(db, 'posts', postId);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() } as Post;
            }
            return null;
        } catch (error) {
            console.error("Error fetching post:", error);
            return null;
        }
    },

    // Get posts by tag
    async getPostsByTag(tag: string): Promise<Post[]> {
        try {
            // Firestore array-contains query
            const q = query(
                collection(db, 'posts'),
                where('tags', 'array-contains', tag.toLowerCase()),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        } catch (error) {
            console.error("Error fetching tag posts:", error);
            // Fallback since index might be missing
            return [];
        }
    }
};
