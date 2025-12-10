import { useState } from 'react';
import { BibleBookSelector } from '../components/bible/BibleBookSelector';
import { BibleChapterSelector } from '../components/bible/BibleChapterSelector';
import { BibleReader } from '../components/bible/BibleReader';
import type { BibleBook } from '../data/bible/bibleData';

type ViewState = 'books' | 'chapters' | 'reader';

export function BiblePage() {
    const [view, setView] = useState<ViewState>('books');
    const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number>(1);

    const handleBookSelect = (book: BibleBook) => {
        setSelectedBook(book);
        setView('chapters');
    };

    const handleChapterSelect = (chapter: number) => {
        setSelectedChapter(chapter);
        setView('reader');
    };

    return (
        <div className="min-h-full bg-cream-50">
            {view === 'books' && (
                <>
                    <div className="px-6 py-8">
                        <h1 className="text-3xl font-serif font-bold text-navy">Bible</h1>
                        <p className="text-gray-500 mt-1">Select a book to begin reading</p>
                    </div>
                    <BibleBookSelector onSelectBook={handleBookSelect} />
                </>
            )}

            {view === 'chapters' && selectedBook && (
                <BibleChapterSelector
                    book={selectedBook}
                    onSelectChapter={handleChapterSelect}
                    onBack={() => setView('books')}
                />
            )}

            {view === 'reader' && selectedBook && (
                <BibleReader
                    book={selectedBook}
                    chapter={selectedChapter}
                    onBack={() => setView('chapters')}
                />
            )}
        </div>
    );
}
