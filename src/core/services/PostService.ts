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
    DocumentSnapshot,
    updateDoc,
    increment,
    setDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Post } from '../data/mockData'; // We'll eventually move Post type to types folder

// Simple in-memory cache
let cachedFeed: Post[] | null = null;
let cachedTrending: { tag: string, count: number, trend: 'hot' | 'rising' | 'cooling', score: number }[] | null = null;
let lastTrendingFetch = 0;

// Helper to extract tags and mentions
const extractEntities = (text: string) => {
    const tags = (text.match(/#[a-z0-9_]+/gi) || []).map(tag => tag.slice(1).toLowerCase());
    const mentions = (text.match(/@[a-z0-9_]+/gi) || []).map(mention => mention.slice(1));
    // Remove duplicates
    return {
        tags: [...new Set(tags)],
        mentions: [...new Set(mentions)]
    };
};

export const PostService = {
    // Get cached feed synchronously (for initial state)
    getCachedFeed(): Post[] | null {
        return cachedFeed;
    },

    // Fetch main feed posts
    async getFeedPosts(lastDoc?: DocumentSnapshot, limitCount = 20): Promise<{ posts: Post[], lastDoc: DocumentSnapshot | null }> {
        try {
            // If explicit refresh (lastDoc is undefined), we might return cache if valid?
            // For now, let's always fetch fresh on explicit call but update cache.
            // Actually, we want to allow standard fetch behavior.

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

            // Update cache only if this is the first page (refresh or init)
            if (!lastDoc) {
                cachedFeed = posts;
            }

            return {
                posts,
                lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
            };
        } catch (error) {
            console.error("Error fetching feed:", error);
            return { posts: [], lastDoc: null };
        }
    },

    // Get specific featured posts
    async getFeaturedPosts(): Promise<Post[]> {
        try {
            const q = query(
                collection(db, 'posts'),
                where('featured', '==', true),
                orderBy('featuredAt', 'desc'), // Most recently featured first
                limit(10) // Limit to 10 featured items for now
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        } catch (error) {
            console.error("Error fetching featured posts:", error);
            return [];
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
    },

    async likePost(postId: string, userId: string) {
        if (!postId || !userId) return;
        const postRef = doc(db, 'posts', postId);
        try {
            // 1. Update post like count
            await updateDoc(postRef, {
                likes: increment(1)
            });
            // 2. Track user like (could be subcollection)
            const likeRef = doc(db, 'posts', postId, 'likes', userId);
            await setDoc(likeRef, {
                userId,
                createdAt: serverTimestamp()
            });

            // Update cache if exists
            if (cachedFeed) {
                const cachedPost = cachedFeed.find(p => p.id === postId);
                if (cachedPost) {
                    cachedPost.likes = (cachedPost.likes || 0) + 1;
                }
            }
        } catch (error) {
            console.error("Error liking post:", error);
            throw error;
        }
    },

    async unlikePost(postId: string, userId: string) {
        if (!postId || !userId) return;
        const postRef = doc(db, 'posts', postId);
        try {
            await updateDoc(postRef, {
                likes: increment(-1)
            });
            await deleteDoc(doc(db, 'posts', postId, 'likes', userId));
            await deleteDoc(doc(db, 'posts', postId, 'likes', userId));

            // Update cache if exists
            if (cachedFeed) {
                const cachedPost = cachedFeed.find(p => p.id === postId);
                if (cachedPost) {
                    cachedPost.likes = Math.max((cachedPost.likes || 0) - 1, 0);
                }
            }
        } catch (error) {
            console.error("Error unliking post:", error);
            throw error;
        }
    },

    // Increment prayer count for a prayer post
    async incrementPrayerCount(postId: string, userId: string) {
        if (!postId || !userId) return;
        const postRef = doc(db, 'posts', postId);
        try {
            await updateDoc(postRef, {
                prayerCount: increment(1),
                [`prayedBy.${userId}`]: true
            });
        } catch (error) {
            console.error("Error incrementing prayer count:", error);
        }
    },

    // Increment amen count for a praise post
    async incrementAmen(postId: string, userId: string) {
        if (!postId || !userId) return;
        const postRef = doc(db, 'posts', postId);
        try {
            await updateDoc(postRef, {
                amenCount: increment(1),
                [`amenBy.${userId}`]: true
            });
        } catch (error) {
            console.error("Error incrementing amen count:", error);
        }
    },

    // Mark a prayer as answered
    async markPrayerAnswered(postId: string, message?: string) {
        if (!postId) return;
        const postRef = doc(db, 'posts', postId);
        try {
            await updateDoc(postRef, {
                answered: true,
                answeredAt: serverTimestamp(),
                ...(message && { answeredMessage: message })
            });
        } catch (error) {
            console.error("Error marking prayer as answered:", error);
        }
    },

    // Edit a post
    async editPost(postId: string, content: string, editorId: string) {
        if (!postId || !content.trim()) return;
        const postRef = doc(db, 'posts', postId);

        // Extract new entities
        const { tags, mentions } = extractEntities(content);

        try {
            await updateDoc(postRef, {
                content: content.trim(),
                tags,
                mentions,
                edited: true,
                lastEditedAt: serverTimestamp(),
                lastEditedBy: editorId
            });
        } catch (error) {
            console.error("Error editing post:", error);
            throw error;
        }
    },

    // Search posts by text
    async searchPosts(term: string): Promise<Post[]> {
        if (!term.trim()) return [];
        const searchTerm = term.toLowerCase().trim();

        try {
            // Strategy 1: Search by Tag (Exact Matches)
            let posts: Post[] = [];
            try {
                const tagQuery = query(
                    collection(db, 'posts'),
                    where('tags', 'array-contains', searchTerm),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );

                const snapshot = await getDocs(tagQuery);
                posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            } catch (indexError) {
                console.warn("Tag search failed (likely missing index), falling back to client-side search:", indexError);
            }

            // Client-side fallback if few or no tag results
            if (posts.length < 10) {
                const recentQuery = query(
                    collection(db, 'posts'),
                    orderBy('createdAt', 'desc'),
                    limit(150) // Increased depth
                );
                const recentSnap = await getDocs(recentQuery);
                const allRecent = recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

                const additionalResults = allRecent.filter(p => {
                    if (posts.some(existing => existing.id === p.id)) return false;

                    const content = (p.content || '').toLowerCase();
                    const caption = (p.caption || '').toLowerCase();
                    const verseText = (p.verse?.text || '').toLowerCase();
                    const verseRef = (p.verse?.ref || '').toLowerCase();
                    const authorName = (p.author?.name || '').toLowerCase();
                    const authorUsername = (p.author?.username || '').toLowerCase();

                    return content.includes(searchTerm) ||
                        caption.includes(searchTerm) ||
                        verseText.includes(searchTerm) ||
                        verseRef.includes(searchTerm) ||
                        authorName.includes(searchTerm) ||
                        authorUsername.includes(searchTerm);
                });

                return [...posts, ...additionalResults].slice(0, 20);
            }

            return posts;
        } catch (error) {
            console.error("Error searching posts:", error);
            return [];
        }
    },
    async repostPost(originalPost: Post, reposterId: string, reposterName: string, reposterAvatar: string) {
        if (!originalPost || !reposterId) return;

        try {
            // 1. Resolve Root Post (if reposting a repost)
            let rootPostId = originalPost.id;
            // Safe access to author fields
            let rootAuthorId = originalPost.authorId || '';
            let rootAuthorName = originalPost.author?.name || 'Unknown';
            let rootAuthorAvatar = originalPost.author?.avatar || '';
            let rootCreatedAt = originalPost.createdAt;

            if (originalPost.repostData) {
                rootPostId = originalPost.repostData.originalPostId;
                rootAuthorId = originalPost.repostData.originalAuthorId;
                rootAuthorName = originalPost.repostData.originalAuthorName || 'Unknown';
                rootAuthorAvatar = originalPost.repostData.originalAuthorAvatar || '';
                rootCreatedAt = originalPost.repostData.originalCreatedAt;
            }

            // Helper to convert Firestore Timestamp to ISO string if needed
            const getIsoString = (val: any): string => {
                if (!val) return new Date().toISOString();
                if (typeof val === 'string') return val;
                if (typeof val.toISOString === 'function') return val.toISOString();
                if (typeof val.toDate === 'function') return val.toDate().toISOString();
                return new Date().toISOString();
            };

            // 2. Create the Repost Document - Only include defined properties
            const newRepost: any = {
                authorId: reposterId,
                author: {
                    name: reposterName,
                    avatar: reposterAvatar
                },
                type: originalPost.type,
                content: originalPost.content || '',
                caption: originalPost.caption || '',
                likes: 0,
                comments: 0,
                shares: 0,
                createdAt: serverTimestamp(),
                repostData: {
                    originalPostId: rootPostId,
                    originalAuthorId: rootAuthorId,
                    originalAuthorName: rootAuthorName,
                    originalAuthorAvatar: rootAuthorAvatar,
                    originalCreatedAt: getIsoString(rootCreatedAt)
                }
            };

            // Optional fields only if they exist on original
            if (originalPost.mediaUrl) newRepost.mediaUrl = originalPost.mediaUrl;
            if (originalPost.tags) newRepost.tags = originalPost.tags;
            if (originalPost.verse) newRepost.verse = originalPost.verse;
            if (originalPost.song) newRepost.song = originalPost.song;
            if (originalPost.background) newRepost.background = originalPost.background;
            if (originalPost.mediaMetadata) newRepost.mediaMetadata = originalPost.mediaMetadata;

            // Explicit Aspect Ratio logic
            const aspectRatio = originalPost.aspectRatio || (originalPost.type === 'verse_art' ? '9:16' : undefined);
            if (aspectRatio) newRepost.aspectRatio = aspectRatio;

            const docRef = await addDoc(collection(db, 'posts'), newRepost);

            // 3. Increment Repost Count on Original (using shares for now as generic 'spread' metric, or we can add specific reposts count)
            // Let's use 'shares' for now as it's already in UI
            const rootPostRef = doc(db, 'posts', rootPostId);
            await updateDoc(rootPostRef, {
                shares: increment(1)
            });

            return docRef.id;
        } catch (error) {
            console.error("Error creating repost:", error);
            throw error;
        }
    },

    // Get posts for Explore page filters
    async getExplorePosts(category: string, limitCount = 20): Promise<Post[]> {
        try {
            let q;
            const cat = category.toLowerCase();

            if (cat === 'trending') {
                // Ideally sort by likes, but requires composite index
                // Fallback to recent with > 0 likes if index issues, or just recent
                q = query(
                    collection(db, 'posts'),
                    orderBy('likes', 'desc'),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
            } else if (cat === 'prayers') {
                q = query(
                    collection(db, 'posts'),
                    where('type', '==', 'prayer'),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
            } else if (cat === 'praise') {
                q = query(
                    collection(db, 'posts'),
                    where('type', '==', 'praise'),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
            } else if (cat === 'verse art') {
                q = query(
                    collection(db, 'posts'),
                    where('type', '==', 'verse_art'),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
            } else if (cat === 'thoughts') {
                q = query(
                    collection(db, 'posts'),
                    where('type', '==', 'thought'),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
            } else {
                // Default tag search or generic worship search
                if (cat === 'worship') {
                    q = query(
                        collection(db, 'posts'),
                        where('tags', 'array-contains', 'worship'),
                        orderBy('createdAt', 'desc'),
                        limit(limitCount)
                    );
                } else {
                    q = query(
                        collection(db, 'posts'),
                        where('tags', 'array-contains', cat),
                        orderBy('createdAt', 'desc'),
                        limit(limitCount)
                    );
                }
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        } catch (error) {
            console.error(`Error fetching explore posts for ${category}:`, error);
            // Fallback to generic feed if error (likely index missing)
            if ((error as any)?.code === 'failed-precondition') {
                console.log("Falling back to feed posts due to missing index");
                const feed = await this.getFeedPosts(undefined, limitCount);
                return feed.posts;
            }
            return [];
        }
    },
    // Enhanced trending tags with weighted scoring and trend detection
    async getTrendingTags(limitCount = 20): Promise<{ tag: string, count: number, trend: 'hot' | 'rising' | 'cooling', score: number }[]> {
        // Return cache if fresh (5 minutes)
        if (cachedTrending && Date.now() - lastTrendingFetch < 5 * 60 * 1000) {
            return cachedTrending as any;
        }

        try {
            const now = Date.now();
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

            // Fetch recent posts from last 7 days with engagement data
            const q = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                limit(200) // Increased for better analysis
            );

            const snapshot = await getDocs(q);

            // Track tag metrics
            interface TagMetrics {
                count: number;
                totalEngagement: number;
                recentCount: number; // Last 24 hours
                previousCount: number; // 24-48 hours ago
                authors: Set<string>;
                posts: Array<{
                    createdAt: any;
                    engagement: number;
                }>;
            }

            const tagMetrics: Record<string, TagMetrics> = {};

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
                const postTime = createdAt.getTime();

                // Skip posts older than 7 days
                if (postTime < sevenDaysAgo) return;

                // Calculate engagement score for this post
                const engagement = (data.likes || 0) * 1 +
                    (data.comments || 0) * 3 +
                    (data.shares || 0) * 2;

                if (data.tags && Array.isArray(data.tags)) {
                    data.tags.forEach((tag: string) => {
                        const normalized = tag.toLowerCase();

                        if (!tagMetrics[normalized]) {
                            tagMetrics[normalized] = {
                                count: 0,
                                totalEngagement: 0,
                                recentCount: 0,
                                previousCount: 0,
                                authors: new Set(),
                                posts: []
                            };
                        }

                        const metrics = tagMetrics[normalized];
                        metrics.count++;
                        metrics.totalEngagement += engagement;
                        metrics.authors.add(data.authorId || 'unknown');
                        metrics.posts.push({ createdAt: postTime, engagement });

                        // Track velocity data
                        if (postTime >= oneDayAgo) {
                            metrics.recentCount++;
                        } else if (postTime >= twoDaysAgo) {
                            metrics.previousCount++;
                        }
                    });
                }
            });

            // Calculate weighted scores and trend direction for each tag
            const scoredTags = Object.entries(tagMetrics).map(([tag, metrics]) => {
                // Recency weight calculation
                let recencyScore = 0;
                metrics.posts.forEach(post => {
                    const age = now - post.createdAt;
                    let weight = 1;

                    if (age < oneDayAgo) {
                        weight = 3; // 3x for last 24 hours
                    } else if (age < twoDaysAgo) {
                        weight = 2; // 2x for 24-48 hours
                    }
                    // 1x for 48 hours - 7 days (default)

                    recencyScore += weight * (1 + post.engagement * 0.1);
                });

                // Diversity penalty (if dominated by single author)
                const authorDiversity = metrics.authors.size / Math.max(metrics.count, 1);
                const diversityMultiplier = Math.min(1, 0.5 + authorDiversity * 0.5); // Min 0.5, max 1.0

                // Calculate velocity change
                const velocity = metrics.recentCount - metrics.previousCount;
                const velocityPercentage = metrics.previousCount > 0
                    ? (velocity / metrics.previousCount) * 100
                    : (metrics.recentCount > 0 ? 100 : 0);

                // Engagement rate (average engagement per post)
                const engagementRate = metrics.totalEngagement / Math.max(metrics.count, 1);

                // Final weighted score
                const score = (recencyScore * 10 + metrics.totalEngagement) * diversityMultiplier;

                // Determine trend direction
                let trend: 'hot' | 'rising' | 'cooling';

                if (engagementRate > 15 && velocityPercentage >= -10) {
                    // High engagement + stable/growing = hot 🔥
                    trend = 'hot';
                } else if (velocityPercentage > 50 || (metrics.recentCount >= 3 && velocityPercentage > 0)) {
                    // Significant velocity increase = rising 📈
                    trend = 'rising';
                } else {
                    // Decreasing or slow growth = cooling 📉
                    trend = 'cooling';
                }

                return {
                    tag,
                    count: metrics.count,
                    score,
                    trend,
                    engagementRate
                };
            });

            // Sort by weighted score and return top N
            const sortedTags = scoredTags
                .sort((a, b) => b.score - a.score)
                .slice(0, limitCount);

            cachedTrending = sortedTags as any;
            lastTrendingFetch = Date.now();

            return sortedTags;

        } catch (error) {
            console.error("Error calculating trending tags:", error);
            return [];
        }
    },

    // Get related tags based on co-occurrence analysis
    async getRelatedTags(targetTag: string, limitCount = 5): Promise<{ tag: string, coOccurrence: number }[]> {
        try {
            const normalizedTarget = targetTag.toLowerCase();

            // Fetch recent posts that contain the target tag
            const q = query(
                collection(db, 'posts'),
                where('tags', 'array-contains', normalizedTarget),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            const snapshot = await getDocs(q);

            // Track co-occurrence counts
            const coOccurrenceCounts: Record<string, number> = {};

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.tags && Array.isArray(data.tags)) {
                    data.tags.forEach((tag: string) => {
                        const normalized = tag.toLowerCase();
                        // Exclude the target tag itself
                        if (normalized !== normalizedTarget) {
                            coOccurrenceCounts[normalized] = (coOccurrenceCounts[normalized] || 0) + 1;
                        }
                    });
                }
            });

            // Convert to array and sort by frequency
            const relatedTags = Object.entries(coOccurrenceCounts)
                .map(([tag, count]) => ({ tag, coOccurrence: count }))
                .sort((a, b) => b.coOccurrence - a.coOccurrence)
                .slice(0, limitCount);

            return relatedTags;

        } catch (error) {
            console.error("Error calculating related tags:", error);
            return [];
        }
    }
};
