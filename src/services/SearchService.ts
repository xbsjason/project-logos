import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Post } from '../data/mockData';
import type { UserProfile } from './UserService';

export interface SearchResultItem {
    id: string;
    type: 'user' | 'post' | 'prayer' | 'hashtag';
    title: string;
    subtitle: string;
    link: string;
    avatar?: string;
    mediaUrl?: string;
}

export const SearchService = {
    /**
     * Search users by username or displayName prefix
     */
    async searchUsers(searchQuery: string, maxResults = 10): Promise<SearchResultItem[]> {
        if (!searchQuery.trim()) return [];

        const normalizedQuery = searchQuery.toLowerCase().trim();

        try {
            // Search by username prefix
            const usernameQuery = query(
                collection(db, 'users'),
                where('username', '>=', normalizedQuery),
                where('username', '<=', normalizedQuery + '\uf8ff'),
                limit(maxResults)
            );

            const snapshot = await getDocs(usernameQuery);
            const users: SearchResultItem[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data() as UserProfile;
                users.push({
                    id: doc.id,
                    type: 'user',
                    title: data.displayName || data.username || 'User',
                    subtitle: `@${data.username}` + (data.stats?.followers ? ` • ${data.stats.followers} followers` : ''),
                    link: `/profile/${doc.id}`,
                    avatar: data.photoURL || undefined,
                });
            });

            return users;
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    },

    /**
     * Search posts by content/caption (client-side filtering due to Firestore limitations)
     */
    async searchPosts(searchQuery: string, maxResults = 15): Promise<SearchResultItem[]> {
        if (!searchQuery.trim()) return [];

        const normalizedQuery = searchQuery.toLowerCase().trim();

        try {
            // Fetch recent posts and filter client-side
            // This is a limitation of Firestore - no full-text search
            const postsQuery = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                limit(50) // Fetch more, filter client-side
            );

            const snapshot = await getDocs(postsQuery);
            const results: SearchResultItem[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data() as Post;
                const content = data.content?.toLowerCase() || '';
                const caption = data.caption?.toLowerCase() || '';

                // Check if query matches content or caption
                if (content.includes(normalizedQuery) || caption.includes(normalizedQuery)) {
                    results.push({
                        id: doc.id,
                        type: data.type === 'prayer' ? 'prayer' : 'post',
                        title: data.type === 'prayer' ? 'Prayer' : (data.type === 'image' ? 'Photo' : 'Post'),
                        subtitle: (data.caption || data.content || '').slice(0, 60) + ((data.caption || data.content || '').length > 60 ? '...' : ''),
                        link: `/post/${doc.id}`,
                        avatar: data.author?.avatar,
                        mediaUrl: data.type === 'image' || data.type === 'video' ? data.content : undefined,
                    });
                }
            });

            return results.slice(0, maxResults);
        } catch (error) {
            console.error('Error searching posts:', error);
            return [];
        }
    },

    /**
     * Search for hashtags and posts containing them
     */
    async searchHashtags(searchQuery: string, maxResults = 10): Promise<SearchResultItem[]> {
        if (!searchQuery.trim()) return [];

        // Remove # if present
        let tag = searchQuery.toLowerCase().trim();
        if (tag.startsWith('#')) {
            tag = tag.slice(1);
        }

        try {
            // Find posts that have this tag
            const postsQuery = query(
                collection(db, 'posts'),
                where('tags', 'array-contains', tag),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );

            const snapshot = await getDocs(postsQuery);

            if (snapshot.empty) {
                return [];
            }

            // Return a single hashtag result that links to the tag feed
            const results: SearchResultItem[] = [{
                id: `tag-${tag}`,
                type: 'hashtag',
                title: `#${tag}`,
                subtitle: `${snapshot.size} post${snapshot.size !== 1 ? 's' : ''}`,
                link: `/tags/${tag}`,
            }];

            return results;
        } catch (error) {
            console.error('Error searching hashtags:', error);
            return [];
        }
    },

    /**
     * Combined search across all types
     */
    async searchAll(searchQuery: string): Promise<SearchResultItem[]> {
        if (!searchQuery.trim()) return [];

        try {
            // Run all searches in parallel
            const [users, posts, hashtags] = await Promise.all([
                this.searchUsers(searchQuery, 5),
                this.searchPosts(searchQuery, 10),
                this.searchHashtags(searchQuery, 3),
            ]);

            // Combine and deduplicate results
            const allResults: SearchResultItem[] = [];

            // Add users first
            allResults.push(...users);

            // Add hashtags
            allResults.push(...hashtags);

            // Add posts (prayers will be labeled as such)
            allResults.push(...posts);

            return allResults;
        } catch (error) {
            console.error('Error in combined search:', error);
            return [];
        }
    }
};
