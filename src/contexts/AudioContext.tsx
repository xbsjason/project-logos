import React, { createContext, useContext, useState } from 'react';
import { AUDIO_CATEGORIES } from '../data/mockAudio';
import type { AudioTrack } from '../data/mockAudio';

interface AudioContextType {
    currentTrack: AudioTrack | null;
    isPlaying: boolean;
    activeCategory: string;
    isSelectorOpen: boolean;
    playTrack: (track: AudioTrack) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrevious: () => void;
    setCategory: (categoryId: string) => void;
    toggleSelector: () => void;
    closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>(AUDIO_CATEGORIES[0].id);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        const handleEnded = () => {
            playNext();
        };

        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, []);

    React.useEffect(() => {
        if (currentTrack && audioRef.current) {
            // Only update src if it's different to prevent reloading
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
            // Toggling play if same track
            setIsPlaying(!isPlaying);
        }
    };

    const togglePlay = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
        } else {
            // If no track, play first track of active category
            const category = AUDIO_CATEGORIES.find(c => c.id === activeCategory);
            if (category && category.tracks.length > 0) {
                playTrack(category.tracks[0]);
            }
        }
    };

    const playNext = () => {
        if (!currentTrack) return;

        // Find current category tracks
        const category = AUDIO_CATEGORIES.find(c => c.id === activeCategory);
        if (!category) return;

        const currentIndex = category.tracks.findIndex(t => t.id === currentTrack.id);

        // Find in ALL_TRACKS if not found in current category (e.g. category switched)
        // For simplicity, we'll stick to current category logic or fallback to index 0
        if (currentIndex === -1) {
            if (category.tracks.length > 0) {
                playTrack(category.tracks[0]);
            }
            return;
        }

        const nextIndex = (currentIndex + 1) % category.tracks.length;
        playTrack(category.tracks[nextIndex]);
    };

    const playPrevious = () => {
        if (!currentTrack) return;

        const category = AUDIO_CATEGORIES.find(c => c.id === activeCategory);
        if (!category) return;

        const currentIndex = category.tracks.findIndex(t => t.id === currentTrack.id);

        if (currentIndex === -1) {
            if (category.tracks.length > 0) {
                playTrack(category.tracks[0]);
            }
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

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            activeCategory,
            isSelectorOpen,
            playTrack,
            togglePlay,
            playNext,
            playPrevious,
            setCategory,
            toggleSelector,
            closePlayer
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
