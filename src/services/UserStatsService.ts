import { doc, increment, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserStats {
    prayersCount: number;
    versesRead: number;
    chaptersRead: number;
    daysStreak: number;
    lastActiveDate: any; // Timestamp
}

export const UserStatsService = {
    /**
     * Increment a specific counter stat for a user
     */
    async incrementStat(userId: string, statName: keyof UserStats) {
        if (!userId) return;

        const statsRef = doc(db, 'users', userId, 'stats', 'main');

        try {
            await updateDoc(statsRef, {
                [statName]: increment(1),
                lastActiveDate: serverTimestamp()
            });
        } catch (error: any) {
            // If doc doesn't exist, create it
            if (error.code === 'not-found') {
                await setDoc(statsRef, {
                    [statName]: 1,
                    prayersCount: statName === 'prayersCount' ? 1 : 0,
                    versesRead: statName === 'versesRead' ? 1 : 0,
                    chaptersRead: statName === 'chaptersRead' ? 1 : 0,
                    daysStreak: 1,
                    lastActiveDate: serverTimestamp()
                });
            } else {
                console.error('Error incrementing stat:', error);
            }
        }
    },

    /**
     * Log a specific activity for timeline/history
     */
    async trackActivity(userId: string, type: 'prayer' | 'reading' | 'bookmark', metadata: any) {
        if (!userId) return;

        try {
            await addDoc(collection(db, 'users', userId, 'activity'), {
                type,
                timestamp: serverTimestamp(),
                metadata
            });
        } catch (error) {
            console.error('Error tracking activity:', error);
        }
    }
};
