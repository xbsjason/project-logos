import { ArrowLeft } from 'lucide-react';

import type { BibleBook } from '../../services/BibleService';
import { useBibleProgress } from '../../contexts/BibleProgressContext';
import { useBibleSettings } from '../../contexts/BibleContext';

interface BibleChapterSelectorProps {
    book: BibleBook;
    onSelectChapter: (chapter: number) => void;
    onBack: () => void;
}

export function BibleChapterSelector({ book, onSelectChapter, onBack }: BibleChapterSelectorProps) {
    const chapters = Array.from({ length: book.chapterCount }, (_, i) => i + 1);
    const { isChapterCompleted } = useBibleProgress();
    const { version } = useBibleSettings();

    return (
        <div className="min-h-full bg-background transition-colors duration-300 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="relative px-6 py-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-secondary hover:text-primary hover:bg-surface-highlight rounded-full transition-colors active:scale-95"
                    >
                        <ArrowLeft size={24} />
                    </button>




                    <div>
                        <h2 className="text-3xl font-serif font-black text-primary tracking-tight leading-none">
                            {book.name}
                        </h2>
                        <span className="text-xs font-bold text-gold tracking-widest uppercase mt-1 block opacity-80">
                            Select Chapter
                        </span>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-secondary uppercase tracking-widest">
                        {book.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                    </div>
                    <div className="text-xs text-secondary/60 font-medium">
                        {book.chapterCount} Chapters
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="px-6 pb-20 relative z-10">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                    {chapters.map((chapter) => {
                        const isCompleted = isChapterCompleted(book.id, chapter, version);
                        return (
                            <button
                                key={chapter}
                                type="button"
                                onClick={() => onSelectChapter(chapter)}
                                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-300 active:scale-95 border group ${isCompleted
                                    ? "bg-gold/10 border-gold text-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                    : "bg-surface border-default text-primary hover:border-gold/50 hover:shadow-lg hover:-translate-y-1 shadow-sm"
                                    }`}
                            >
                                <span className={`text-xl font-serif font-bold transition-transform duration-300 ${isCompleted ? "" : "group-hover:scale-110"}`}>
                                    {chapter}
                                </span>
                                {isCompleted && (
                                    <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-gold animate-pulse shadow-[0_0_5px_rgba(212,175,55,0.5)]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}
