import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';
import { AUDIO_CATEGORIES } from '../../data/mockAudio';
import { Play, Music, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export function AudioSelector() {
    const {
        isSelectorOpen,
        toggleSelector,
        activeCategory,
        setCategory,
        currentTrack,
        playTrack,
        isPlaying
    } = useAudio();

    const category = AUDIO_CATEGORIES.find(c => c.id === activeCategory) || AUDIO_CATEGORIES[0];

    return (
        <AnimatePresence>
            {isSelectorOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSelector}
                        className="fixed inset-0 bg-navy-dark/40 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl h-[80vh] flex flex-col max-w-md mx-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                                <Music size={20} className="text-gold-500" />
                                Music & Ambience
                            </h2>
                            <button
                                onClick={toggleSelector}
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
                                    onClick={() => setCategory(cat.id)}
                                    className={clsx(
                                        "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all",
                                        activeCategory === cat.id
                                            ? "bg-navy text-white shadow-md transform scale-105"
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
                                const isCurrent = currentTrack?.id === track.id;
                                return (
                                    <button
                                        key={track.id}
                                        onClick={() => playTrack(track)}
                                        className={clsx(
                                            "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group",
                                            isCurrent ? "bg-cream-200 border border-gold-200" : "hover:bg-gray-50 border border-transparent"
                                        )}
                                    >
                                        <div className="relative">
                                            <img
                                                src={track.coverUrl}
                                                alt={track.title}
                                                className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
                                            />
                                            {isCurrent && isPlaying && (
                                                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                                                    <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={clsx(
                                                "font-bold text-sm truncate",
                                                isCurrent ? "text-gold-700" : "text-navy"
                                            )}>
                                                {track.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                                        </div>

                                        {isCurrent && (
                                            <div className="text-gold-500">
                                                <Play size={16} fill="currentColor" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
