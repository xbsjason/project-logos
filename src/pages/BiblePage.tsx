import { useState } from 'react';
import { BibleBookSelector } from '../components/bible/BibleBookSelector';
import { BibleChapterSelector } from '../components/bible/BibleChapterSelector';
import { BibleReader } from '../components/bible/BibleReader';
import { useBooks } from '../hooks/useBible';
import type { BibleBook } from '../services/BibleService';
import { Loader2, Search } from 'lucide-react';
import { BibleProvider } from '../contexts/BibleContext';
import { useOutletContext } from 'react-router-dom';
import type { AppSearchContext } from '../components/layout/AppShell';
import { BibleProgressProvider, useBibleProgress } from '../contexts/BibleProgressContext';
import { Bookmark, ArrowRight } from 'lucide-react';
import { BibleBookmarks } from '../components/bible/BibleBookmarks';

type ViewState = 'books' | 'chapters' | 'reader' | 'bookmarks';

export function BiblePage() {
    return (
        <BibleProvider>
            <BibleProgressProvider>
                <BiblePageContent />
            </BibleProgressProvider>
        </BibleProvider>
    );
}

function BiblePageContent() {
    const { toggleSearch } = useOutletContext<AppSearchContext>();
    const [view, setView] = useState<ViewState>('books');
    const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    const [initialVerse, setInitialVerse] = useState<number | undefined>(undefined);

    const { books, loading, error } = useBooks();
    const { lastRead, loading: progressLoading } = useBibleProgress();

    // Auto-resume logic or prompt could go here. 
    // For now, let's just show a "Resume Reading" banner if we are in book selection mode.

    // Scroll Helper
    const scrollToTop = () => {
        const mainContainer = document.getElementById('main-scroll-container');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: 'instant' });
        } else {
            window.scrollTo(0, 0);
        }
    };

    const handleBookSelect = (book: BibleBook) => {
        setSelectedBook(book);
        setInitialVerse(undefined);
        setView('chapters');
        scrollToTop();
    };

    const handleChapterSelect = (chapter: number) => {
        setSelectedChapter(chapter);
        setInitialVerse(undefined);
        setView('reader');
        scrollToTop();
    };

    const handleBookmarkSelect = (bookmark: any) => { // Type 'any' for now to avoid strict import coupling issues if types not exported perfectly, but we should import Bookmark
        const book = books.find(b => b.id === bookmark.bookId);
        if (book) {
            setSelectedBook(book);
            setSelectedChapter(bookmark.chapter);
            setInitialVerse(bookmark.verse);
            setView('reader');
            scrollToTop();
        }
    };

    const handleResume = () => {
        if (lastRead) {
            const book = books.find(b => b.id === lastRead.bookId);
            if (book) {
                setSelectedBook(book);
                setSelectedChapter(lastRead.chapter);
                setInitialVerse(lastRead.verse);
                setView('reader');
                scrollToTop();
            }
        }
    };

    // Only block on critical data (Bible books), not user progress
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-cream-50 dark:bg-navy transition-colors duration-300">
                <Loader2 className="w-8 h-8 animate-spin text-navy dark:text-gold" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-cream-50 dark:bg-navy p-4 text-center transition-colors duration-300">
                <p className="text-red-500">Failed to load Bible data. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-background transition-colors duration-300">
            {view === 'books' && (
                <>
                    <div className="px-6 py-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-serif font-black text-gold tracking-widest uppercase drop-shadow-sm">Bible</h1>
                            <p className="text-secondary mt-1">Select a book to begin reading</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setView('bookmarks')}
                                className="p-2 bg-surface text-primary rounded-full hover:bg-surface-highlight active:scale-95 transition-all shadow-sm"
                            >
                                <Bookmark size={20} />
                            </button>
                            <button
                                onClick={toggleSearch}
                                className="p-2 bg-surface text-primary rounded-full hover:bg-surface-highlight active:scale-95 transition-all shadow-sm"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Resume Reading Banner */}
                    {progressLoading ? (
                        <div className="px-6 mb-6">
                            <div className="w-full h-[72px] bg-surface/50 border border-gold/20 rounded-xl relative overflow-hidden">
                                <div className="absolute inset-0 animate-shimmer-gold brightness-150" />
                            </div>
                        </div>
                    ) : lastRead ? (
                        <div className="px-6 mb-6">
                            <button
                                onClick={handleResume}
                                className="w-full h-[72px] bg-surface border border-gold/30 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-gold transition-all group relative overflow-hidden animate-shimmer-gold"
                            >
                                <div className="text-left relative z-10">
                                    <span className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
                                        Continue Reading
                                    </span>
                                    <div className="text-lg font-serif font-bold text-primary mt-1">
                                        {lastRead.bookName} {lastRead.chapter}{lastRead.verse ? `:${lastRead.verse}` : ''}
                                    </div>
                                </div>
                                <ArrowRight className="text-gold relative z-10 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    ) : null}

                    <BibleBookSelector books={books} onSelectBook={handleBookSelect} />
                </>
            )}

            {view === 'bookmarks' && (
                <BibleBookmarks
                    onBack={() => {
                        setView('books');
                        scrollToTop();
                    }}
                    onSelectBookmark={handleBookmarkSelect}
                />
            )}

            {view === 'chapters' && selectedBook && (
                <BibleChapterSelector
                    book={selectedBook}
                    onSelectChapter={handleChapterSelect}
                    onBack={() => {
                        setView('books');
                        scrollToTop();
                    }}
                />
            )}

            {view === 'reader' && selectedBook && (
                <BibleReader
                    book={selectedBook}
                    chapter={selectedChapter}
                    initialVerse={initialVerse}
                    onBack={() => {
                        setView('chapters'); // Go back to books if we resumed, else chapters? Or just standard back flow? 
                        // Better user exp: If came from bookmarks, maybe go back to bookmarks?
                        // For simplicity, let's check if we just want to go up one level.
                        // If we are in reader, back usually goes to chapters.
                        setView('chapters');
                        scrollToTop();
                    }}
                    onNext={() => {
                        // Check if we can go to next chapter in current book
                        if (selectedChapter < selectedBook.chapterCount) {
                            setSelectedChapter(c => c + 1);
                            setInitialVerse(undefined);
                            window.scrollTo(0, 0);
                        }
                        // If not, go to next book
                        else {
                            const currentBookIndex = books.findIndex(b => b.id === selectedBook.id);
                            if (currentBookIndex < books.length - 1) {
                                setSelectedBook(books[currentBookIndex + 1]);
                                setSelectedChapter(1);
                                setInitialVerse(undefined);
                                window.scrollTo(0, 0);
                            }
                        }
                    }}
                    onPrevious={() => {
                        // Check if we can go to prev chapter
                        if (selectedChapter > 1) {
                            setSelectedChapter(c => c - 1);
                            setInitialVerse(undefined);
                            window.scrollTo(0, 0);
                        }
                        // If not, go to prev book
                        else {
                            const currentBookIndex = books.findIndex(b => b.id === selectedBook.id);
                            if (currentBookIndex > 0) {
                                const prevBook = books[currentBookIndex - 1];
                                setSelectedBook(prevBook);
                                setSelectedChapter(prevBook.chapterCount);
                                setInitialVerse(undefined);
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
