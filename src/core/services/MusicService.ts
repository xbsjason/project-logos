import {
    collection,
    getDocs,
    orderBy,
    query,
    addDoc,
    doc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { AUDIO_CATEGORIES, type AudioCategory, type AudioTrack, type AudioPlaylist } from '../data/mockAudio';

export const MusicService = {
    // Get all music categories
    async getCategories(): Promise<AudioCategory[]> {
        try {
            // 1. Fetch Categories
            const categoriesRef = collection(db, 'audio_categories');
            const catSnapshot = await getDocs(query(categoriesRef, orderBy('order', 'asc')));

            // 2. Fetch All Tracks (Real Data)
            const tracksRef = collection(db, 'audio_tracks');
            const trackSnapshot = await getDocs(query(tracksRef, orderBy('createdAt', 'desc')));
            const realTracks = trackSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AudioTrack[];

            // Decision: Use Real Data logic if we have ANY real categories OR ANY real tracks.
            const hasRealData = !catSnapshot.empty || realTracks.length > 0;

            if (!hasRealData) {
                // Completely pure mock mode only if NO real data exists at all
                console.log("No real audio data found, using complete mock data");
                return AUDIO_CATEGORIES;
            }

            // Build Base Categories
            let categories: AudioCategory[] = [];

            if (!catSnapshot.empty) {
                // Use DB Categories
                categories = catSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || 'Unknown Category',
                    ...doc.data(),
                    tracks: [] as AudioTrack[]
                })) as AudioCategory[];
            } else {
                // Use Mock Categories Structure (but empty tracks) as fallback template
                // This allows users to add songs to "Worship" without creating the category first
                console.log("Using mock category structure for real tracks");
                categories = AUDIO_CATEGORIES.map(c => ({
                    ...c,
                    tracks: [] // Start empty, will fill with real tracks
                }));
            }

            // 3. Distribute Real Tracks to Categories
            realTracks.forEach(track => {
                const catId = (track as any).category || (track as any).categoryId || 'worship';
                const category = categories.find(c => c.id === catId);

                if (category) {
                    category.tracks.push(track);
                } else {
                    // Track belongs to a category that doesn't exist in our current set
                    // We could add it to the first category, or a "General" one
                    // For now, let's put it in the first one if available
                    if (categories.length > 0) {
                        categories[0].tracks.push(track);
                    }
                }
            });

            // Return categories that have tracks, or all of them? 
            // Better to return all so user sees the structure (if we used mock structure)
            // But maybe filter out empty ones if we used DB categories?
            // Let's stick to returning them all for now to be safe, or filter empty if desired.
            return categories;

        } catch (error) {
            console.error("Error fetching audio categories:", error);
            return AUDIO_CATEGORIES;
        }
    },

    // Get all tracks (for Admin)
    async getAllTracks(): Promise<AudioTrack[]> {
        try {
            const tracksRef = collection(db, 'audio_tracks');
            const snapshot = await getDocs(query(tracksRef, orderBy('createdAt', 'desc')));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AudioTrack[];
        } catch (error) {
            console.error("Error fetching all tracks:", error);
            return [];
        }
    },

    // Get tracks for a category
    async getTracksByCategory(categoryId: string): Promise<AudioTrack[]> {
        const category = AUDIO_CATEGORIES.find(c => c.id === categoryId);
        if (category) return category.tracks;

        // Fallback or generic logic
        return [];
    },

    // Search tracks function
    async searchTracks(queryStr: string): Promise<AudioTrack[]> {
        const lowerQ = queryStr.toLowerCase();
        // Flatten mock data
        const allTracks = AUDIO_CATEGORIES.flatMap(c => c.tracks); // TODO: Switch to real search
        return allTracks.filter(t =>
            t.title.toLowerCase().includes(lowerQ) ||
            t.artist.toLowerCase().includes(lowerQ)
        );
    },

    // Upload Audio File
    async uploadAudioFile(file: File, path: string = 'music'): Promise<string> {
        if (!file) throw new Error("No file provided");

        const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    },

    async uploadCoverImage(file: File): Promise<string> {
        const storageRef = ref(storage, `audio-covers/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    },

    // Save Track Metadata
    async saveTrackMetadata(trackData: Omit<AudioTrack, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'audio_tracks'), {
            ...trackData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async deleteTrack(trackId: string): Promise<void> {
        await deleteDoc(doc(db, 'audio_tracks', trackId));
    },

    // Update Track
    async updateTrack(trackId: string, updates: Partial<Omit<AudioTrack, 'id'>>): Promise<void> {
        const docRef = doc(db, 'audio_tracks', trackId);
        // Clean undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        await import('firebase/firestore').then(({ updateDoc }) =>
            updateDoc(docRef, { ...cleanUpdates, updatedAt: serverTimestamp() })
        );
    },

    // --- Categories Management ---

    async createCategory(name: string, order: number): Promise<string> {
        const docRef = await addDoc(collection(db, 'audio_categories'), {
            name,
            order,
            tracks: [] // Virtual field, usually
        });
        return docRef.id;
    },

    async updateCategory(id: string, updates: Partial<AudioCategory>): Promise<void> {
        const { id: _, tracks: __, ...realUpdates } = updates as any; // Strip protected/virtual fields
        await import('firebase/firestore').then(({ updateDoc }) =>
            updateDoc(doc(db, 'audio_categories', id), realUpdates)
        );
    },

    async deleteCategory(id: string): Promise<void> {
        await deleteDoc(doc(db, 'audio_categories', id));
    },

    // --- Playlist Management ---

    async getPlaylists(): Promise<AudioPlaylist[]> {
        const snapshot = await getDocs(query(collection(db, 'audio_playlists'), orderBy('createdAt', 'desc')));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudioPlaylist));
    },

    async createPlaylist(data: Omit<AudioPlaylist, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'audio_playlists'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updatePlaylist(id: string, updates: Partial<AudioPlaylist>): Promise<void> {
        const { id: _, createdAt: __, ...realUpdates } = updates;
        await import('firebase/firestore').then(({ updateDoc }) =>
            updateDoc(doc(db, 'audio_playlists', id), {
                ...realUpdates,
                updatedAt: serverTimestamp()
            })
        );
    },

    async deletePlaylist(id: string): Promise<void> {
        await deleteDoc(doc(db, 'audio_playlists', id));
    },

    async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
        const { arrayUnion, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'audio_playlists', playlistId), {
            trackIds: arrayUnion(trackId),
            updatedAt: serverTimestamp()
        });
    },

    async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
        const { arrayRemove, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'audio_playlists', playlistId), {
            trackIds: arrayRemove(trackId),
            updatedAt: serverTimestamp()
        });
    },

    // Legacy / Seeding
    async seedAudioData(): Promise<void> {
        // ... (Existing implementation kept but can be trimmed later)
        console.log("Starting seedAudioData...");
        try {
            // 1. Seed Categories
            const categoriesRef = collection(db, 'audio_categories');
            console.log(`Seeding ${AUDIO_CATEGORIES.length} categories...`);
            for (const cat of AUDIO_CATEGORIES) {
                try {
                    await addDoc(categoriesRef, {
                        id: cat.id,
                        name: cat.name,
                        order: AUDIO_CATEGORIES.indexOf(cat)
                    });
                    console.log(`Seeded category: ${cat.name}`);
                } catch (e) {
                    console.error(`Failed to seed category ${cat.name}:`, e);
                }
            }

            // 2. Seed Tracks
            const tracksRef = collection(db, 'audio_tracks');
            const allTracks = AUDIO_CATEGORIES.flatMap(c => c.tracks.map(t => ({ ...t, categoryId: c.id })));
            console.log(`Seeding ${allTracks.length} tracks...`);

            for (const track of allTracks) {
                try {
                    const { id, ...trackData } = track;
                    await addDoc(tracksRef, {
                        ...trackData,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    console.log(`Seeded track: ${track.title}`);
                } catch (e) {
                    console.error(`Failed to seed track ${track.title}:`, e);
                }
            }
            console.log("Seed complete.");
        } catch (error) {
            console.error("Critical error during seeding:", error);
            throw error;
        }
    }
};

