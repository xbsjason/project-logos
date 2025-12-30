import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    type DocumentData,
    setDoc,
    startAfter
} from 'firebase/firestore';
import { db } from './firebase';
import {
    type Moment,
    type MomentCategory,
    type UserMomentHistory,
    type MomentIntent
} from '../types/Moment';

const MOMENTS_COLL = 'moments';
const USER_HISTORY_COLL = 'user_moment_history';

export const MomentService = {

    // --- Core CRUD ---

    async getMoment(id: string): Promise<Moment | null> {
        const docRef = doc(db, MOMENTS_COLL, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Moment;
        }
        return null;
    },

    async createMoment(moment: Omit<Moment, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, MOMENTS_COLL), {
            ...moment,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateMoment(id: string, updates: Partial<Moment>): Promise<void> {
        const docRef = doc(db, MOMENTS_COLL, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    async deleteMoment(id: string): Promise<void> {
        await deleteDoc(doc(db, MOMENTS_COLL, id));
    },

    // --- List & Filter ---

    async getPublishedMoments(
        category?: MomentCategory,
        intent?: MomentIntent,
        lastDoc?: DocumentData, // Now used for pagination
        pageSize = 20
    ): Promise<{ moments: Moment[], lastDoc: DocumentData | null }> {
        let q = query(
            collection(db, MOMENTS_COLL),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (category && intent) {
            q = query(
                collection(db, MOMENTS_COLL),
                where('status', '==', 'published'),
                where('category', '==', category),
                where('intents', 'array-contains', intent),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );
        } else if (category) {
            q = query(
                collection(db, MOMENTS_COLL),
                where('status', '==', 'published'),
                where('category', '==', category),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );
        } else if (intent) {
            q = query(
                collection(db, MOMENTS_COLL),
                where('status', '==', 'published'),
                where('intents', 'array-contains', intent),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );
        }

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const querySnapshot = await getDocs(q);
        const moments = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Moment));
        const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

        return { moments, lastDoc: lastVisible };
    },

    async searchMoments(
        searchQuery: string,
        category?: MomentCategory,
        maxResults = 20
    ): Promise<Moment[]> {
        if (!searchQuery.trim()) return [];

        const term = searchQuery.toLowerCase().trim();

        try {
            // Since Firestore doesn't support multi-field full-text search,
            // we'll fetch a larger set of published moments and filter client-side.
            // In a real production app with thousands of moments, we'd use Algolia.
            let q = query(
                collection(db, MOMENTS_COLL),
                where('status', '==', 'published'),
                orderBy('publishedAt' in ({} as any) ? 'publishedAt' : 'createdAt', 'desc'),
                limit(200) // Scan depth
            );

            if (category) {
                q = query(
                    collection(db, MOMENTS_COLL),
                    where('status', '==', 'published'),
                    where('category', '==', category),
                    orderBy('publishedAt' in ({} as any) ? 'publishedAt' : 'createdAt', 'desc'),
                    limit(200)
                );
            }

            const snap = await getDocs(q);
            const allMoments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Moment));

            const filtered = allMoments.filter(m => {
                const title = (m.title || '').toLowerCase();
                const message = (m.message || '').toLowerCase();
                const quote = (m.verseQuote || '').toLowerCase();
                const book = (m.verseReference?.book || '').toLowerCase();
                const tags = (m.tags || []).map(t => t.toLowerCase());

                return title.includes(term) ||
                    message.includes(term) ||
                    quote.includes(term) ||
                    book.includes(term) ||
                    tags.some(t => t.includes(term));
            });

            return filtered.slice(0, maxResults);
        } catch (e) {
            console.error('Search moments error:', e);
            return [];
        }
    },

    // --- Admin ---

    async getAdminMoments(
        statusFilter?: string,
        categoryFilter?: string
    ): Promise<Moment[]> {
        // Basic implementation - filtering done client side or simple index
        let q = query(
            collection(db, MOMENTS_COLL),
            orderBy('createdAt', 'desc'),
            limit(50) // Cap for safety
        );

        if (statusFilter && statusFilter !== 'all') {
            q = query(
                collection(db, MOMENTS_COLL),
                where('status', '==', statusFilter),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
        }

        // Note: Compound queries with category might require specific indexes

        const snap = await getDocs(q);
        let moments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Moment));

        if (categoryFilter && categoryFilter !== 'all') {
            moments = moments.filter(m => m.category === categoryFilter);
        }

        return moments;
    },

    async getAllMoments(): Promise<Moment[]> {
        const q = query(
            collection(db, MOMENTS_COLL),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Moment));
    },

    // --- Explore Logic ---

    async getMomentsForExplore(uid?: string): Promise<Moment[]> {
        try {
            // 1. Determine Context (Time of Day)
            const hour = new Date().getHours();
            let timeIntent: MomentIntent = 'midday';
            if (hour >= 5 && hour < 12) timeIntent = 'morning';
            else if (hour >= 12 && hour < 17) timeIntent = 'midday';
            else if (hour >= 17 && hour < 21) timeIntent = 'evening';
            else timeIntent = 'night';

            // 2. Get User History
            let seenIds: string[] = [];
            let isNewUser = true;

            if (uid) {
                const historyRef = doc(db, USER_HISTORY_COLL, uid);
                const historySnap = await getDoc(historyRef);
                if (historySnap.exists()) {
                    const data = historySnap.data() as UserMomentHistory;
                    seenIds = data.recentlySeenMomentIds || [];
                    // If they have seen > 0 moments, they aren't new
                    if ((data.recentlySeenMomentIds?.length || 0) > 0) {
                        isNewUser = false;
                    }
                }
            }

            // 3. Query Candidates
            // Strategy: Fetch a batch of published moments that match intent OR are general encouragement
            // We can't do complex OR queries easily in one go with exclusions, so we fetch a broader set.

            const intentsToQuery = [timeIntent, 'encouragement'];
            if (isNewUser) intentsToQuery.push('new_user');

            // Firestore "array-contains-any" allows up to 10 values
            const q = query(
                collection(db, MOMENTS_COLL),
                where('status', '==', 'published'),
                where('intents', 'array-contains-any', intentsToQuery),
                orderBy('createdAt', 'desc'),
                limit(30)
            );

            const snap = await getDocs(q);
            let candidates = snap.docs.map(d => ({ id: d.id, ...d.data() } as Moment));

            // 4. Filter & Sort
            // Remove seen
            candidates = candidates.filter(m => !seenIds.includes(m.id!));

            // Prioritize: New User -> Time Specific -> General
            const scored = candidates.map(m => {
                let score = 0;
                if (m.intents.includes('new_user') && isNewUser) score += 10;
                if (m.intents.includes(timeIntent)) score += 5;
                // Deterministic shuffle: use ID hash or createdAt to randomize slightly if scores equal?
                // For now, stable sort by score then date
                return { moment: m, score };
            });

            scored.sort((a, b) => b.score - a.score);

            // Take top 8
            let topMoments = scored.slice(0, 8).map(s => s.moment);

            // Backfill if not enough
            if (topMoments.length < 5) {
                const generalQ = query(
                    collection(db, MOMENTS_COLL),
                    where('status', '==', 'published'),
                    limit(10) // Just grab some recent ones
                );
                const genSnap = await getDocs(generalQ);
                const genMoments = genSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as Moment))
                    .filter(m => !seenIds.includes(m.id!) && !topMoments.find(t => t.id === m.id));

                topMoments = [...topMoments, ...genMoments].slice(0, 8);
            }

            return topMoments;

        } catch (e) {
            console.error("Error fetching explore moments:", e);
            return [];
        }
    },

    // --- User Interaction ---

    async markMomentSeen(uid: string, momentId: string) {
        const historyRef = doc(db, USER_HISTORY_COLL, uid);

        // Check if document exists first
        const historySnap = await getDoc(historyRef);

        if (!historySnap.exists()) {
            // Create new history document
            await setDoc(historyRef, {
                uid,
                savedMomentIds: [],
                recentlySeenMomentIds: [momentId],
                lastSeenAt: serverTimestamp()
            });
        } else {
            // Update existing document
            await updateDoc(historyRef, {
                recentlySeenMomentIds: arrayUnion(momentId),
                lastSeenAt: serverTimestamp()
            });
        }
    },

    async toggleSaveMoment(uid: string, momentId: string, shouldSave: boolean) {
        const historyRef = doc(db, USER_HISTORY_COLL, uid);

        // Check if document exists first
        const historySnap = await getDoc(historyRef);

        if (!historySnap.exists()) {
            // Create new history document
            await setDoc(historyRef, {
                uid,
                savedMomentIds: shouldSave ? [momentId] : [],
                recentlySeenMomentIds: [],
                lastSeenAt: serverTimestamp()
            });
        } else {
            // Update existing document
            if (shouldSave) {
                await updateDoc(historyRef, {
                    savedMomentIds: arrayUnion(momentId)
                });
            } else {
                await updateDoc(historyRef, {
                    savedMomentIds: arrayRemove(momentId)
                });
            }
        }
    },

    async getUserHistory(uid: string): Promise<UserMomentHistory | null> {
        const snap = await getDoc(doc(db, USER_HISTORY_COLL, uid));
        if (snap.exists()) return snap.data() as UserMomentHistory;
        return null;
    }
};
