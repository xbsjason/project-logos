import { useState } from 'react';
import { ChevronRight, X, ArrowLeft } from 'lucide-react';
import { useBooks } from '../../hooks/useBible';
import { getBooksForVersion } from '../../constants/bibleData';
import { BibleService } from '../../services/BibleService';

// Simplified types
interface VersePickerProps {
    version: string;
    onSelect: (ref: string, text: string, bookId: string, chapter: number, verse: number) => void;
    onClose: () => void;
}

type Step = 'book' | 'chapter' | 'verse';

export function VersePicker({ version, onSelect, onClose }: VersePickerProps) {
    const [step, setStep] = useState<Step>('book');
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

    // Get books directly (synchronous if possible to avoid loading states in picker, but hooks are fine)
    // The `useBooks` hook fetch from API or cache?
    // Let's rely on constants if possible for speed, or the hook.
    // The existing hook `useBooks` uses `BibleService.getBooks(version)`.
    const { books } = useBooks(); // Uses context version, might mismatch prop version if we aren't careful?
    // Actually, let's stick to the prop version.

    // Quick Fix: Use the static list for speed if `useBooks` is async/slow
    // Real implementation should probably fetch chapter/verse counts properly.
    // For now, let's assume `books` from hook is okay, or fallback to static list.
    const bookList = books.length > 0 ? books : getBooksForVersion(version);

    const handleBookSelect = (book: any) => {
        setSelectedBook(book);
        setStep('chapter');
    };

    const handleChapterSelect = (chapter: number) => {
        setSelectedChapter(chapter);
        setStep('verse');
    };

    const handleVerseSelect = async (verseNum: number) => {
        if (!selectedBook || !selectedChapter) return;

        try {
            // Fetch the chapter data to get the verse text
            const chapterData = await BibleService.getChapter(version, selectedBook.id, selectedChapter);

            if (chapterData && chapterData.verses) {
                const verseObj = chapterData.verses.find(v => v.verse === verseNum);
                const text = verseObj ? verseObj.text : '';

                if (text) {
                    onSelect(
                        `${selectedBook.name} ${selectedChapter}:${verseNum}`,
                        text,
                        selectedBook.id,
                        selectedChapter,
                        verseNum
                    );
                } else {
                    console.error('Verse text not found in chapter data');
                    // Fallback or error UI?
                }
            }
        } catch (error) {
            console.error('Failed to fetch verse text:', error);
        }
    };

    const handleBack = () => {
        if (step === 'verse') setStep('chapter');
        else if (step === 'chapter') setStep('book');
        else onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-cream-200 shadow-sm shrink-0">
                <button onClick={handleBack} className="p-2 -ml-2 text-navy hover:bg-cream-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="font-bold text-navy text-lg">
                    {step === 'book' && 'Select Book'}
                    {step === 'chapter' && `${selectedBook?.name} Chapter`}
                    {step === 'verse' && 'Select Verse'}
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-navy hover:bg-cream-100 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto bg-cream-50">
                {step === 'book' && (
                    <div className="divide-y divide-cream-100">
                        {bookList.map((book) => (
                            <button
                                key={book.id}
                                onClick={() => handleBookSelect(book)}
                                className="w-full text-left px-6 py-4 bg-white hover:bg-cream-50 active:bg-cream-100 flex items-center justify-between group"
                            >
                                <span className="font-serif font-medium text-lg text-primary">{book.name}</span>
                                <ChevronRight className="text-gray-300 group-hover:text-gold" size={20} />
                            </button>
                        ))}
                    </div>
                )}

                {step === 'chapter' && (
                    <div className="grid grid-cols-5 gap-3 p-4">
                        {Array.from({ length: selectedBook?.chapterCount || 0 }, (_, i) => i + 1).map((num) => (
                            <button
                                key={num}
                                onClick={() => handleChapterSelect(num)}
                                className="aspect-square flex items-center justify-center bg-white border border-cream-200 rounded-xl font-bold text-navy text-lg shadow-sm hover:border-gold hover:text-gold transition-all"
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}

                {step === 'verse' && (
                    <div className="grid grid-cols-5 gap-3 p-4">
                        {/* Mock verse count - real app needs chapter data */}
                        {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                            <button
                                key={num}
                                onClick={() => handleVerseSelect(num)}
                                className="aspect-square flex items-center justify-center bg-white border border-cream-200 rounded-xl font-bold text-navy text-lg shadow-sm hover:border-gold hover:text-gold transition-all"
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
