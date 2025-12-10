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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>(AUDIO_CATEGORIES[0].id);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const playTrack = (track: AudioTrack) => {
        setCurrentTrack(track);
        setIsPlaying(true);
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

        // If track not in current category (e.g. category switched), maybe start from beginning or find in global
        // For now, let's assume valid flow
        if (currentIndex === -1) {
            // Fallback: try to find in current category regardless
            playTrack(category.tracks[0]);
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
            playTrack(category.tracks[0]);
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
            toggleSelector
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
