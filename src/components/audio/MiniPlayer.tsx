import { Play, Pause, SkipForward, ListMusic, X } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { clsx } from 'clsx';
import { useLocation } from 'react-router-dom';

export function MiniPlayer() {
    const { currentTrack, isPlaying, togglePlay, playNext, toggleSelector, closePlayer } = useAudio();
    const location = useLocation();

    if (!currentTrack) return null;

    // Hide on some screens if needed (e.g. while recording video)
    const isExcludedRoute = location.pathname.includes('/create') && location.search.includes('step=media');
    if (isExcludedRoute) return null;

    if (!currentTrack) {
        return (
            <div className="fixed bottom-20 right-4 z-40">
                <button
                    onClick={toggleSelector}
                    className="flex items-center gap-2 bg-navy-dark/95 text-white px-4 py-2 rounded-full shadow-lg border border-white/10 hover:bg-navy transition-colors backdrop-blur-md"
                >
                    <ListMusic size={20} />
                    <span className="text-sm font-medium">Music</span>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-2 pb-1">
            <div className="max-w-md mx-auto bg-navy-dark/95 backdrop-blur-md text-white p-3 rounded-xl shadow-lg border border-white/10 flex items-center gap-3">
                {/* Artwork */}
                <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className={clsx(
                        "w-10 h-10 rounded-lg object-cover bg-gray-800",
                        isPlaying && "animate-spin-slow"
                    )}
                />

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={togglePlay}>
                    <h4 className="font-bold text-sm truncate">{currentTrack.title}</h4>
                    <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        className="p-2 bg-white/10 rounded-full active:scale-95 transition-all"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); playNext(); }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <SkipForward size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleSelector(); }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ListMusic size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
