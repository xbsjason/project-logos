import { useState } from 'react';
import { BibleBookSelector } from '../components/bible/BibleBookSelector';
import { BibleChapterSelector } from '../components/bible/BibleChapterSelector';
import { BibleReader } from '../components/bible/BibleReader';
import { useBooks } from '../hooks/useBible';
import type { BibleBook } from '../services/BibleService';
import { Loader2 } from 'lucide-react';

type ViewState = 'books' | 'chapters' | 'reader';

export function BiblePage() {
    const [view, setView] = useState<ViewState>('books');
    const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number>(1);

    const { books, loading, error } = useBooks();
    // const books: BibleBook[] = []; const loading = false; const error = null;

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-cream-50">
                <Loader2 className="w-8 h-8 animate-spin text-navy" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-cream-50 p-4 text-center">
                <p className="text-red-500">Failed to load Bible data. Please try again later.</p>
            </div>
        );
    }

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
                    <BibleBookSelector books={books} onSelectBook={handleBookSelect} />
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
                    onNext={() => {
                        // Check if we can go to next chapter in current book
                        if (selectedChapter < selectedBook.chapterCount) {
                            setSelectedChapter(c => c + 1);
                            window.scrollTo(0, 0);
                        }
                        // If not, go to next book
                        else {
                            const currentBookIndex = books.findIndex(b => b.id === selectedBook.id);
                            if (currentBookIndex < books.length - 1) {
                                setSelectedBook(books[currentBookIndex + 1]);
                                setSelectedChapter(1);
                                window.scrollTo(0, 0);
                            }
                        }
                    }}
                    onPrevious={() => {
                        // Check if we can go to prev chapter
                        if (selectedChapter > 1) {
                            setSelectedChapter(c => c - 1);
                            window.scrollTo(0, 0);
                        }
                        // If not, go to prev book
                        else {
                            const currentBookIndex = books.findIndex(b => b.id === selectedBook.id);
                            if (currentBookIndex > 0) {
                                const prevBook = books[currentBookIndex - 1];
                                setSelectedBook(prevBook);
                                setSelectedChapter(prevBook.chapterCount);
                                window.scrollTo(0, 0);
                            }
                        }
                    }}
                    isFirstChapter={selectedChapter === 1 && books[0]?.id === selectedBook.id}
                    isLastChapter={selectedChapter === selectedBook.chapterCount && books[books.length - 1]?.id === selectedBook.id}
                />
            )}
        </div>
    );
}
