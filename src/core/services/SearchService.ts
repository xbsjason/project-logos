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

import { offlineBibleService } from './OfflineBibleService';

export interface SearchResultItem {
    id: string;
    type: 'user' | 'post' | 'prayer' | 'hashtag' | 'bible';
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
            let tagSnap;
            let recentSnap;

            try {
                // Strategy 1: Search by Tag (Exact Match found in tags array)
                const tagQuery = query(
                    collection(db, 'posts'),
                    where('tags', 'array-contains', normalizedQuery),
                    orderBy('createdAt', 'desc'),
                    limit(maxResults)
                );
                tagSnap = await getDocs(tagQuery);
            } catch (e) {
                console.warn('Search tags query failed (possibly missing index):', e);
                tagSnap = { forEach: () => { } }; // Mock empty snapshot
            }

            try {
                // Strategy 2: Client-side Text Scan (Recent Posts)
                const recentPostsQuery = query(
                    collection(db, 'posts'),
                    orderBy('createdAt', 'desc'),
                    limit(150) // Increase scan depth for fallback
                );
                recentSnap = await getDocs(recentPostsQuery);
            } catch (e) {
                console.error('Core recent posts query failed:', e);
                return []; // Critical failure if we can't even get recent posts
            }

            const resultsMap = new Map<string, SearchResultItem>();

            // Process Tag Results
            tagSnap.forEach((doc) => {
                const data = doc.data() as Post;
                resultsMap.set(doc.id, {
                    id: doc.id,
                    type: data.type === 'prayer' ? 'prayer' : 'post',
                    title: data.type === 'prayer' ? 'Prayer' : (data.type === 'verse_art' ? 'Verse Art' : 'Post'),
                    subtitle: (data.caption || data.content || '').slice(0, 60) + '...',
                    link: `/post/${doc.id}`,
                    avatar: data.author?.avatar,
                    mediaUrl: data.type === 'image' || data.type === 'verse_art' ? data.content : undefined,
                });
            });

            // Process Recent Scan Results
            recentSnap.forEach((doc) => {
                if (resultsMap.has(doc.id)) return; // Skip if already found by tag

                const data = doc.data() as Post;
                const content = (data.content || '').toLowerCase();
                const caption = (data.caption || '').toLowerCase();
                const verseText = (data.verse?.text || '').toLowerCase();
                const verseRef = (data.verse?.ref || '').toLowerCase();
                const authorName = (data.author?.name || '').toLowerCase();
                const authorUsername = (data.author?.username || '').toLowerCase();

                if (
                    content.includes(normalizedQuery) ||
                    caption.includes(normalizedQuery) ||
                    verseText.includes(normalizedQuery) ||
                    verseRef.includes(normalizedQuery) ||
                    authorName.includes(normalizedQuery) ||
                    authorUsername.includes(normalizedQuery)
                ) {
                    resultsMap.set(doc.id, {
                        id: doc.id,
                        type: data.type === 'prayer' ? 'prayer' : 'post',
                        title: data.type === 'prayer' ? 'Prayer' : (data.type === 'verse_art' ? 'Verse Art' : 'Post'),
                        subtitle: (data.caption || data.verse?.text || data.content || '').slice(0, 60) + '...',
                        link: `/post/${doc.id}`,
                        avatar: data.author?.avatar,
                        mediaUrl: data.type === 'image' || data.type === 'verse_art' ? data.content : undefined,
                    });
                }
            });

            return Array.from(resultsMap.values()).slice(0, maxResults);
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
     * Search Bible Verses (Local Cache)
     */
    async searchVerses(searchQuery: string, maxResults = 20): Promise<SearchResultItem[]> {
        if (!searchQuery.trim()) return [];

        try {
            const verseResults = await offlineBibleService.searchLocalBible(searchQuery, maxResults);

            return verseResults.map((v, idx) => ({
                id: `verse-${v.bookId}-${v.chapter}-${v.verse}-${idx}`,
                type: 'bible',
                title: `${v.bookId.toUpperCase()} ${v.chapter}:${v.verse} (${v.version.toUpperCase()})`,
                subtitle: v.text,
                link: `/bible/${v.version}/${v.bookId}/${v.chapter}/${v.verse}`,
            }));
        } catch (error) {
            console.error('Error searching verses:', error);
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
