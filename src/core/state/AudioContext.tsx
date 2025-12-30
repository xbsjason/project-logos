import React, { createContext, useContext, useState } from 'react';
import { AUDIO_CATEGORIES, type AudioTrack, type AudioCategory, type AudioPlaylist } from '../data/mockAudio';
import { MusicService } from '../services/MusicService';

interface AudioContextType {
    currentTrack: AudioTrack | null;
    isPlaying: boolean;
    activeCategory: string;
    categories: AudioCategory[];
    playlists: AudioPlaylist[];
    isSelectorOpen: boolean;
    playTrack: (track: AudioTrack) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrevious: () => void;
    setCategory: (categoryId: string) => void;
    toggleSelector: () => void;
    closePlayer: () => void;
    playPlaylist: (playlist: AudioPlaylist) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>(AUDIO_CATEGORIES[0].id);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const [categories, setCategories] = useState<AudioCategory[]>(AUDIO_CATEGORIES);
    const [playlists, setPlaylists] = useState<AudioPlaylist[]>([]);

    // Initial load
    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedCategories, fetchedPlaylists] = await Promise.all([
                    MusicService.getCategories(),
                    MusicService.getPlaylists()
                ]);

                if (fetchedCategories && fetchedCategories.length > 0) {
                    setCategories(fetchedCategories);
                    // Ensure active category is valid
                    setActiveCategory(prev => {
                        const exists = fetchedCategories.find(c => c.id === prev);
                        return exists ? prev : fetchedCategories[0].id;
                    });
                }

                if (fetchedPlaylists) {
                    setPlaylists(fetchedPlaylists);
                }
            } catch (err) {
                console.warn("AudioProvider: Failed to load data", err);
                // Fallback is already initial state (mock data)
            }
        };
        loadData();
    }, []);

    React.useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        // ... (rest of audio setup)
        const audio = audioRef.current;
        const handleEnded = () => { playNext(); };
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, []); // Removed categories dependency to avoid re-binding

    React.useEffect(() => {
        if (currentTrack && audioRef.current) {
            const url = currentTrack.audioUrl;
            if (audioRef.current.src !== url && url) {
                audioRef.current.src = url;
                if (isPlaying) {
                    audioRef.current.play().catch(e => console.error("Playback failed:", e));
                }
            }
        }
    }, [currentTrack]);

    React.useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                if (audioRef.current.src) {
                    audioRef.current.play().catch(e => console.error("Playback failed:", e));
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const playTrack = (track: AudioTrack) => {
        if (currentTrack?.id !== track.id) {
            setCurrentTrack(track);
            setIsPlaying(true);
        } else {
            setIsPlaying(!isPlaying);
        }
    };

    const togglePlay = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
        } else {
            const category = categories.find(c => c.id === activeCategory);
            if (category && category.tracks.length > 0) {
                playTrack(category.tracks[0]);
            }
        }
    };

    const playNext = () => {
        if (!currentTrack) return;
        const category = categories.find(c => c.id === activeCategory);
        if (!category) return;
        const currentIndex = category.tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) {
            if (category.tracks.length > 0) playTrack(category.tracks[0]);
            return;
        }
        const nextIndex = (currentIndex + 1) % category.tracks.length;
        playTrack(category.tracks[nextIndex]);
    };

    const playPrevious = () => {
        if (!currentTrack) return;
        const category = categories.find(c => c.id === activeCategory);
        if (!category) return;
        const currentIndex = category.tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) {
            if (category.tracks.length > 0) playTrack(category.tracks[0]);
            return;
        }
        const prevIndex = (currentIndex - 1 + category.tracks.length) % category.tracks.length;
        playTrack(category.tracks[prevIndex]);
    };

    const setCategory = (categoryId: string) => {
        setActiveCategory(categoryId);
    };

    const toggleSelector = () => {
        setIsSelectorOpen(prev => !prev);
    };

    const closePlayer = () => {
        setIsPlaying(false);
        setCurrentTrack(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const playPlaylist = (playlist: AudioPlaylist) => {
        // 1. Flatten all tracks from categories to find matches
        const allTracks = categories.flatMap(c => c.tracks);
        // Remove duplicates if any
        const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.id, t])).values());

        // 2. Resolve tracks for the playlist
        const playlistTracks = playlist.trackIds
            .map(id => uniqueTracks.find(t => t.id === id))
            .filter((t): t is AudioTrack => !!t);

        if (playlistTracks.length === 0) {
            console.warn("Playlist has no tracks or tracks not found");
            return;
        }

        // 3. Create a pseudo-category for the playlist
        const playlistCategory: AudioCategory = {
            id: playlist.id,
            name: playlist.title,
            tracks: playlistTracks,
            order: 9999
        };

        // 4. Update categories state if not already present
        // We use a functional update to avoid race conditions, though strict equality check is enough
        setCategories(prev => {
            const exists = prev.find(c => c.id === playlist.id);
            if (exists) {
                // Update tracks in case they changed? For now just return prev
                return prev.map(c => c.id === playlist.id ? playlistCategory : c);
            }
            return [...prev, playlistCategory];
        });

        // 5. Set active category and play first track
        setActiveCategory(playlist.id);
        playTrack(playlistTracks[0]);
    };

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            activeCategory,
            categories,
            playlists,
            isSelectorOpen,
            playTrack,
            togglePlay,
            playNext,
            playPrevious,
            setCategory,
            toggleSelector,
            closePlayer,
            playPlaylist // Exposed
        }}>
            {children}
        </AudioContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
