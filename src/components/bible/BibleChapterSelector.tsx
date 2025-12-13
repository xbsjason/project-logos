import { ArrowLeft } from 'lucide-react';
import type { BibleBook } from '../../services/BibleService';
import { useBibleProgress } from '../../contexts/BibleProgressContext';

interface BibleChapterSelectorProps {
    book: BibleBook;
    onSelectChapter: (chapter: number) => void;
    onBack: () => void;
}

export function BibleChapterSelector({ book, onSelectChapter, onBack }: BibleChapterSelectorProps) {
    const chapters = Array.from({ length: book.chapterCount }, (_, i) => i + 1);
    const { isChapterCompleted } = useBibleProgress();

    return (
        <div className="p-4 bg-background min-h-full transition-colors duration-300">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-primary hover:bg-surface rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-serif font-bold text-primary">{book.name}</h2>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {chapters.map((chapter) => {
                    const isCompleted = isChapterCompleted(book.id, chapter);
                    return (
                        <button
                            key={chapter}
                            onClick={() => onSelectChapter(chapter)}
                            className={`aspect-square flex items-center justify-center rounded-lg shadow-sm border text-lg font-semibold transition-all active:scale-95
                                ${isCompleted
                                    ? 'bg-gold/10 border-gold/30 text-gold'
                                    : 'bg-surface border-default text-primary hover:border-accent hover:text-accent active:bg-surface-highlight'
                                }
                            `}
                        >
                            {chapter}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
