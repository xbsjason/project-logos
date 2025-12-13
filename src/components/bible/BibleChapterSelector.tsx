import { ArrowLeft } from 'lucide-react';
import type { BibleBook } from '../../services/BibleService';

interface BibleChapterSelectorProps {
    book: BibleBook;
    onSelectChapter: (chapter: number) => void;
    onBack: () => void;
}

export function BibleChapterSelector({ book, onSelectChapter, onBack }: BibleChapterSelectorProps) {
    const chapters = Array.from({ length: book.chapterCount }, (_, i) => i + 1);

    return (
        <div className="p-4 bg-background min-h-full transition-colors duration-300">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-primary hover:bg-surface rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-serif font-bold text-primary">{book.name}</h2>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {chapters.map((chapter) => (
                    <button
                        key={chapter}
                        onClick={() => onSelectChapter(chapter)}
                        className="aspect-square flex items-center justify-center bg-surface rounded-lg shadow-sm border border-default text-primary font-semibold text-lg hover:border-accent hover:text-accent active:bg-surface-highlight active:scale-95 transition-all"
                    >
                        {chapter}
                    </button>
                ))}
            </div>
        </div>
    );
}
