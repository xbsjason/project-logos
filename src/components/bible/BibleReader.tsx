import { useState, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { getChapterVerses } from '../../data/bible/bibleData';
import type { BibleBook, BibleVerse } from '../../data/bible/bibleData';
import { VerseActionMenu } from './VerseActionMenu';

interface BibleReaderProps {
    book: BibleBook;
    chapter: number;
    onBack: () => void;
}

export function BibleReader({ book, chapter, onBack }: BibleReaderProps) {
    const [verses, setVerses] = useState<BibleVerse[]>([]);
    const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);

    useEffect(() => {
        setVerses(getChapterVerses(book.id, chapter));
    }, [book, chapter]);

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
                        key={verse.id}
                        onClick={() => setSelectedVerse(verse)}
                        className={`relative group p-2 -mx-2 rounded-lg transition-colors cursor-pointer ${selectedVerse?.id === verse.id ? 'bg-gold/10' : 'active:bg-cream-100'}`}
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

            <div className="px-5 py-8 text-center">
                <button className="text-navy font-semibold flex items-center justify-center gap-2 w-full py-4 bg-white rounded-xl shadow-sm border border-cream-200">
                    Next Chapter
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
