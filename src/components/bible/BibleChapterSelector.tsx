import type { BibleBook } from '../../data/bible/bibleData';
import { ArrowLeft } from 'lucide-react';

interface BibleChapterSelectorProps {
    book: BibleBook;
    onSelectChapter: (chapter: number) => void;
    onBack: () => void;
}

export function BibleChapterSelector({ book, onSelectChapter, onBack }: BibleChapterSelectorProps) {
    const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

    return (
        <div className="p-4">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-navy">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-serif font-bold text-navy">{book.name}</h2>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {chapters.map((chapter) => (
                    <button
                        key={chapter}
                        onClick={() => onSelectChapter(chapter)}
                        className="aspect-square flex items-center justify-center bg-white rounded-lg shadow-sm border border-cream-200 text-navy font-semibold text-lg active:bg-gold-light/20 active:border-gold transition-all"
                    >
                        {chapter}
                    </button>
                ))}
            </div>
        </div>
    );
}
