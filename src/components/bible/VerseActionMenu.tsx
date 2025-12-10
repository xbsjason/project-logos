import { Copy, Share2, PenTool, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerseActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    verseRef: string;
    verseText: string;
}

import { createPortal } from 'react-dom';

export function VerseActionMenu({ isOpen, onClose, verseRef, verseText }: VerseActionMenuProps) {
    const navigate = useNavigate();
    if (!isOpen) return null;

    const handleCopy = () => {
        // In real app: navigator.clipboard.writeText(...)
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

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 animate-in zoom-in-95 fade-in duration-200 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-navy text-lg">{verseRef}</h3>
                    <button onClick={onClose} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <p className="text-gray-600 italic text-sm line-clamp-3 mb-4 border-l-4 border-gold pl-3">
                    "{verseText}"
                </p>

                <div className="grid grid-cols-3 gap-3">
                    <button onClick={handleCopy} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cream-100 text-navy hover:bg-cream-200 transition-colors">
                        <Copy size={24} />
                        <span className="text-xs font-bold">Copy</span>
                    </button>
                    <button onClick={onClose} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cream-100 text-navy hover:bg-cream-200 transition-colors">
                        <Share2 size={24} />
                        <span className="text-xs font-bold">Share</span>
                    </button>
                    <button onClick={handleCreateArt} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cream-100 text-navy hover:bg-cream-200 transition-colors">
                        <PenTool size={24} />
                        <span className="text-xs font-bold">Create Art</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
