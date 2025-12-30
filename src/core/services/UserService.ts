import {
    doc,
    getDoc,
    writeBatch,
    increment,
    serverTimestamp,
    collection,
    query,
    getDocs,
    where,
    limit,
    arrayUnion,
    arrayRemove,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserStats {
    followers: number;
    following: number;
    devotionals: number;
}

export interface UserProfile {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    username: string | null;
    bio?: string;
    website?: string;
    stats: UserStats;
    isAnonymous: boolean;
    isFounder?: boolean;
    savedPostIds?: string[];
}

export const UserService = {
    // Get user profile by ID
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data() as UserProfile;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    },

    // Check if current user follows target user
    async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
        if (!currentUserId || !targetUserId) return false;
        try {
            const followDoc = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
            return followDoc.exists();
        } catch (error) {
            console.error("Error checking follow status:", error);
            return false;
        }
    },

    // Follow a user
    async followUser(currentUserId: string, targetUserId: string) {
        if (!currentUserId || !targetUserId) return;

        const batch = writeBatch(db);
        const timestamp = serverTimestamp();

        // 1. Add valid follow document to current user's 'following' subcollection
        const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
        batch.set(followingRef, { createdAt: timestamp });

        // 2. Add valid follower document to target user's 'followers' subcollection
        const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
        batch.set(followersRef, { createdAt: timestamp });

        // 3. Increment 'following' count for current user
        const currentUserRef = doc(db, 'users', currentUserId);
        batch.update(currentUserRef, {
            'stats.following': increment(1)
        });

        // 4. Increment 'followers' count for target user
        const targetUserRef = doc(db, 'users', targetUserId);
        batch.update(targetUserRef, {
            'stats.followers': increment(1)
        });

        await batch.commit();
    },

    // Unfollow a user
    async unfollowUser(currentUserId: string, targetUserId: string) {
        if (!currentUserId || !targetUserId) return;

        const batch = writeBatch(db);

        // 1. Remove from 'following'
        const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
        batch.delete(followingRef);

        // 2. Remove from 'followers'
        const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
        batch.delete(followersRef);

        // 3. Decrement 'following' count
        const currentUserRef = doc(db, 'users', currentUserId);
        batch.update(currentUserRef, {
            'stats.following': increment(-1)
        });

        // 4. Decrement 'followers' count
        const targetUserRef = doc(db, 'users', targetUserId);
        batch.update(targetUserRef, {
            'stats.followers': increment(-1)
        });

        await batch.commit();
    },
    // Get User Lists (Followers/Following)
    async getUsers(userId: string, type: 'followers' | 'following'): Promise<UserProfile[]> {
        try {
            const subCollection = type; // 'followers' or 'following'
            const q = query(collection(db, 'users', userId, subCollection));
            const querySnapshot = await getDocs(q);

            const userIds = querySnapshot.docs.map(doc => doc.id);

            if (userIds.length === 0) return [];

            // In a real app with many users, we would paginate and batch these fetches.
            // Firestore 'in' query supports up to 10 items. For now, we will fetch individually using Promise.all
            // or use batches of 10 if we want to be optimizing. 
            // For this MVP, Promise.all on individual fetches is okay for small scale, 
            // but let's do a documentFromId fetch helper pattern.

            const userPromises = userIds.map(id => getDoc(doc(db, 'users', id)));
            const userSnaps = await Promise.all(userPromises);

            return userSnaps
                .filter(snap => snap.exists())
                .map(snap => snap.data() as UserProfile);

        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            return [];
        }
    },

    // Search users by username or display name
    async searchUsers(queryText: string): Promise<UserProfile[]> {
        if (!queryText.trim()) return [];
        const searchTerm = queryText.toLowerCase();

        try {
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('username', '>=', searchTerm),
                where('username', '<=', searchTerm + '\uf8ff'),
                limit(10)
            );

            const snapshot = await getDocs(q);
            const users = snapshot.docs.map(doc => doc.data() as UserProfile);

            return users;
        } catch (error) {
            console.error("Error searching users:", error);
            return [];
        }
    },

    // Save a post to bookmarks
    async savePost(userId: string, postId: string) {
        if (!userId || !postId) return;
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, {
                savedPostIds: arrayUnion(postId)
            });
        } catch (err) {
            console.error("Error saving post:", err);
        }
    },

    // Unsave a post
    async unsavePost(userId: string, postId: string) {
        if (!userId || !postId) return;
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, {
                savedPostIds: arrayRemove(postId)
            });
        } catch (error) {
            console.error("Error unsaving post:", error);
        }
    }
};
