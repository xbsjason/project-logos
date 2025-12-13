import { Copy, Share2, PenTool, X, Bookmark, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useBibleProgress } from '../../contexts/BibleProgressContext';

interface VerseActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    verseRef: string;
    verseText: string;
    bookId: string;
    chapter: number;
    verse: number;
}

import { useBibleSettings } from '../../contexts/BibleContext';

export function VerseActionMenu({ isOpen, onClose, verseRef, verseText, bookId, chapter, verse }: VerseActionMenuProps) {
    const navigate = useNavigate();
    const { toggleBookmark, isBookmarked } = useBibleProgress();
    const { version } = useBibleSettings();

    if (!isOpen) return null;

    const isSaved = isBookmarked(bookId, chapter, verse, version);

    const handleCopy = () => {
        // In real app: navigator.clipboard.writeText(...)
        navigator.clipboard.writeText(`${verseText} - ${verseRef}`);
        console.log('Copied:', verseText);
        onClose();
    };

    const handleCreateArt = () => {
        const params = new URLSearchParams({
            type: 'verse_art',
            verseRef,
            verseText
        });
        navigate(`/create?${params.toString()}`);
    };

    const handleBookmark = () => {
        toggleBookmark({
            bookId,
            bookName: verseRef.split(' ')[0], // Rough extraction, passed ref usually has book name
            chapter,
            verse,
            version
        });
        // Don't close immediately so they see the toggle state? Or close?
        // Usually nice to close after an action, but toggle might be better to stay open?
        // Let's close for now for snappy feel.
        // Wait small amount for visual feedback if needed, but user requested dismiss.
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-md bg-surface rounded-2xl p-6 space-y-4 animate-in zoom-in-95 fade-in duration-200 shadow-xl border border-default"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-primary text-lg">{verseRef}</h3>
                    <button onClick={onClose} className="p-1 bg-surface-highlight rounded-full hover:bg-default transition-colors">
                        <X size={20} className="text-secondary" />
                    </button>
                </div>

                <p className="text-secondary italic text-sm line-clamp-3 mb-4 border-l-4 border-highlight pl-3">
                    "{verseText}"
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleBookmark} className={`flex items-center justify-center gap-3 p-4 rounded-xl transition-all border ${isSaved ? 'bg-gold text-white border-gold' : 'bg-surface-highlight text-primary hover:bg-default border-transparent hover:border-accent'}`}>
                        {isSaved ? <Check size={20} /> : <Bookmark size={20} />}
                        <span className="text-sm font-bold">{isSaved ? 'Saved' : 'Bookmark'}</span>
                    </button>

                    <button onClick={handleCreateArt} className="flex items-center justify-center gap-3 p-4 rounded-xl bg-surface-highlight text-primary hover:bg-default transition-colors border border-transparent hover:border-accent">
                        <PenTool size={20} />
                        <span className="text-sm font-bold">Create Art</span>
                    </button>

                    <button onClick={handleCopy} className="flex items-center justify-center gap-3 p-4 rounded-xl bg-surface-highlight text-primary hover:bg-default transition-colors border border-transparent hover:border-accent">
                        <Copy size={20} />
                        <span className="text-sm font-bold">Copy</span>
                    </button>

                    <button onClick={() => onClose()} className="flex items-center justify-center gap-3 p-4 rounded-xl bg-surface-highlight text-primary hover:bg-default transition-colors border border-transparent hover:border-accent">
                        <Share2 size={20} />
                        <span className="text-sm font-bold">Share</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

