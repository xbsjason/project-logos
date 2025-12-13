import { motion, AnimatePresence } from 'framer-motion';
import { AUDIO_CATEGORIES, type AudioTrack } from '../../data/mockAudio';
import { Play, Music, ChevronDown, Check, Pause } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useRef, useEffect } from 'react';

interface TrackPickerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (track: AudioTrack) => void;
    selectedTrackId?: string;
}

export function TrackPickerSheet({ isOpen, onClose, onSelect, selectedTrackId }: TrackPickerSheetProps) {
    const [activeCategory, setActiveCategory] = useState(AUDIO_CATEGORIES[0].id);
    const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const category = AUDIO_CATEGORIES.find(c => c.id === activeCategory) || AUDIO_CATEGORIES[0];

    // Handle preview playback
    useEffect(() => {
        if (previewTrackId) {
            const track = AUDIO_CATEGORIES.flatMap(c => c.tracks).find(t => t.id === previewTrackId);
            if (track && audioRef.current) {
                audioRef.current.src = track.audioUrl;
                audioRef.current.play().catch(e => console.error("Preview play failed", e));
            }
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
    }, [previewTrackId]);

    // Stop audio when closing
    useEffect(() => {
        if (!isOpen) {
            setPreviewTrackId(null);
        }
    }, [isOpen]);

    const togglePreview = (e: React.MouseEvent, trackId: string) => {
        e.stopPropagation();
        setPreviewTrackId(prev => prev === trackId ? null : trackId);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-navy-dark/40 backdrop-blur-sm z-50"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl h-[80vh] flex flex-col max-w-md mx-auto"
                    >
                        {/* Audio Element for Preview */}
                        <audio ref={audioRef} onEnded={() => setPreviewTrackId(null)} />

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                                <Music size={20} className="text-gold-500" />
                                Select Music
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <ChevronDown size={24} />
                            </button>
                        </div>

                        {/* Category Tabs */}
                        <div className="flex overflow-x-auto p-4 gap-2 no-scrollbar border-b border-gray-50">
                            {AUDIO_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={clsx(
                                        "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all",
                                        activeCategory === cat.id
                                            ? "bg-navy text-white shadow-md"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Track List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {category.tracks.map(track => {
                                const isSelected = selectedTrackId === track.id;
                                const isPreviewing = previewTrackId === track.id;

                                return (
                                    <div
                                        key={track.id}
                                        onClick={() => onSelect(track)}
                                        className={clsx(
                                            "w-full flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer group border-2",
                                            isSelected
                                                ? "bg-cream-100 border-gold-400"
                                                : "hover:bg-gray-50 border-transparent hover:border-gray-100"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={track.coverUrl}
                                                alt={track.title}
                                                className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                            />
                                            <button
                                                onClick={(e) => togglePreview(e, track.id)}
                                                className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {isPreviewing ? (
                                                    <Pause size={16} className="text-white" fill="currentColor" />
                                                ) : (
                                                    <Play size={16} className="text-white" fill="currentColor" />
                                                )}
                                            </button>
                                            {isPreviewing && (
                                                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                                                    <Pause size={16} className="text-white" fill="currentColor" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={clsx(
                                                "font-bold text-sm truncate",
                                                isSelected ? "text-navy" : "text-gray-900"
                                            )}>
                                                {track.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                                        </div>

                                        {isSelected && (
                                            <div className="text-gold-600 bg-gold-100 p-1.5 rounded-full">
                                                <Check size={16} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
