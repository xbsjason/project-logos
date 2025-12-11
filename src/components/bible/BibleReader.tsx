import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, MoreHorizontal } from 'lucide-react';
import { useChapter } from '../../hooks/useBible';
import type { BibleBook, BibleVerse } from '../../services/BibleService';
import { VerseActionMenu } from './VerseActionMenu';

interface BibleReaderProps {
    book: BibleBook;
    chapter: number;
    onBack: () => void;
    onNext: () => void;
    onPrevious: () => void;
    isFirstChapter: boolean;
    isLastChapter: boolean;
}

export function BibleReader({ book, chapter, onBack, onNext, onPrevious, isFirstChapter, isLastChapter }: BibleReaderProps) {
    const { data, loading, error } = useChapter(book.id, chapter);
    const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
    const verses = data?.verses || [];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-cream-50">
                <Loader2 className="w-8 h-8 animate-spin text-navy" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-cream-50 p-4 text-center">
                <p className="text-red-500 mb-4">Thinking about the Word... (Failed to load)</p>
                <button onClick={onBack} className="text-navy underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="pb-20 bg-cream-50 min-h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-cream-100/90 backdrop-blur-md border-b border-cream-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 -ml-2 text-navy">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-navy">{book.name} {chapter}</h2>
                        <p className="text-xs text-gray-500">Berean Study Bible</p>
                    </div>
                </div>
                <button className="p-2 text-navy">
                    <MoreHorizontal size={24} />
                </button>
            </div>

            {/* Verses */}
            <div className="px-5 py-6 space-y-4 max-w-xl mx-auto">
                {verses.map((verse) => (
                    <div
                        key={verse.verse}
                        onClick={() => setSelectedVerse(verse)}
                        className={`relative group p-2 -mx-2 rounded-lg transition-colors cursor-pointer ${selectedVerse?.verse === verse.verse ? 'bg-gold/10' : 'active:bg-cream-100'}`}
                    >
                        <span className="absolute -left-2 top-3 text-[10px] font-bold text-gold opacity-60">
                            {verse.verse}
                        </span>
                        <p className="text-lg leading-relaxed text-navy-dark font-serif selection:bg-gold-light/30 pl-2">
                            {verse.text}
                        </p>
                    </div>
                ))}
            </div>

            <div className="px-5 py-8 grid grid-cols-2 gap-4">
                <button
                    onClick={onPrevious}
                    disabled={isFirstChapter}
                    className={`text-navy font-semibold flex items-center justify-center gap-2 w-full py-4 bg-white rounded-xl shadow-sm border border-cream-200 transition-all ${isFirstChapter ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:bg-cream-50'}`}
                >
                    <ArrowLeft size={20} />
                    Previous
                </button>
                <button
                    onClick={onNext}
                    className="text-navy font-semibold flex items-center justify-center gap-2 w-full py-4 bg-white rounded-xl shadow-sm border border-cream-200 transition-all active:scale-95 hover:bg-cream-50"
                >
                    {isLastChapter ? 'Next Book' : 'Next Chapter'}
                    <ArrowRight size={20} />
                </button>
            </div>

            <VerseActionMenu
                isOpen={!!selectedVerse}
                onClose={() => setSelectedVerse(null)}
                verseRef={`${book.name} ${chapter}:${selectedVerse?.verse}`}
                verseText={selectedVerse?.text || ''}
            />
        </div>
    );
}
