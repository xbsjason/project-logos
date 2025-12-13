import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useChapter } from '../../hooks/useBible';
import type { BibleBook, BibleVerse } from '../../services/BibleService';
import { VerseActionMenu } from './VerseActionMenu';
import { useBibleSettings } from '../../contexts/BibleContext';
import { BibleSettings } from './BibleSettings';
import { useBibleProgress } from '../../contexts/BibleProgressContext';
import { useLayout } from '../../contexts/LayoutContext';
import useLongPress from '../../hooks/useLongPress';

interface BibleReaderProps {
    book: BibleBook;
    chapter: number;
    initialVerse?: number;
    onBack: () => void;
    onNext: () => void;
    onPrevious: () => void;
    isFirstChapter: boolean;
    isLastChapter: boolean;
}

// Sub-component for individual verses to handle interactions cleanly
function VerseItem({
    verse,
    fontSize,
    fontFamily,
    isSelected,
    bookmarked,
    onLongPress,
    verseRefSetter
}: {
    verse: BibleVerse;
    fontSize: number;
    fontFamily: string;
    isSelected: boolean;
    bookmarked: boolean;
    onLongPress: (verse: BibleVerse) => void;
    verseRefSetter: (verseId: number, el: HTMLDivElement | null) => void;
}) {
    // Only trigger menu on long press
    const { onMouseDown, onTouchStart, onMouseUp, onMouseLeave, onTouchEnd } = useLongPress(
        () => onLongPress(verse),
        () => { /* Click handler - currently do nothing to prevent accidental taps */ },
        { delay: 500 }
    );

    return (
        <div
            ref={el => verseRefSetter(verse.verse, el)}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchEnd={onTouchEnd}
            className={`relative group p-2 -mx-2 rounded-lg transition-colors cursor-pointer select-none ${isSelected ? 'bg-surface-highlight border border-accent/20' : 'hover:bg-surface-highlight/50 active:bg-surface-highlight'} ${bookmarked ? 'border-l-4 border-l-gold bg-gold/5 dark:bg-gold/10' : ''}`}
        >
            <span className="absolute -left-2 top-3 text-xs font-bold text-accent opacity-60">
                {verse.verse}
            </span>
            <p
                className="leading-relaxed text-primary selection:bg-accent/30 pl-2 transition-all duration-300"
                style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    lineHeight: '1.6'
                }}
            >
                {verse.text}
            </p>
        </div>
    );
}

export function BibleReader({ book, chapter, onBack, onNext, onPrevious, isFirstChapter, isLastChapter, initialVerse }: BibleReaderProps) {
    const { data, loading, error } = useChapter(book.id, chapter);
    const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { fontSize, fontFamily } = useBibleSettings();
    const { isBookmarked } = useBibleProgress();
    const verses = data?.verses || [];
    const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    // Immersive Mode State
    const { setBottomNavVisible } = useLayout();
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Scroll detection for immersive mode
    useEffect(() => {
        const onScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            // Ensure we are tracking the main scroll container
            if (target.tagName !== 'MAIN' && target !== document.documentElement) return;

            const currentScrollY = target.scrollTop;
            const diff = currentScrollY - lastScrollY.current;
            const threshold = 10; // Minimum scroll to trigger change

            if (Math.abs(diff) < threshold) return;

            if (diff > 0 && currentScrollY > 50) {
                // Scrolling Down
                setIsHeaderVisible(false);
                setBottomNavVisible(false);
            } else if (diff < 0) {
                // Scrolling Up
                setIsHeaderVisible(true);
                setBottomNavVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        // Use capture phase to detect scroll on nested 'main' element
        window.addEventListener('scroll', onScroll, { capture: true });

        return () => {
            window.removeEventListener('scroll', onScroll, { capture: true });
            setBottomNavVisible(true); // Reset on unmount
        };
    }, [setBottomNavVisible]);

    // Scroll to initial verse on load
    useEffect(() => {
        if (!loading && initialVerse && verseRefs.current[initialVerse]) {
            setTimeout(() => {
                verseRefs.current[initialVerse]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: Flash highlights or something
            }, 500);
        }
    }, [loading, initialVerse]);

    // Track progress (simple version: save current chapter/book when internal component mounts or potentially on scroll)
    // For now, let's just save "Last Read" as the start of the chapter when we enter it, 
    // or if the user clicks a verse. IntersectionObserver is better but more complex.
    useEffect(() => {
        if (!loading) {
            // saveProgress({
            //     bookId: book.id,
            //     bookName: book.name,
            //     chapter: chapter,
            //     verse: initialVerse || 1 // Default to 1 if no specific verse
            // });
        }
    }, [book.id, chapter, loading]); // Remove initialVerse from deps to avoid saving updates when just scrolling (unless we track scroll)

    // Verify if we should update progress on scroll - users might want to know EXACTLY where they left off.
    // For this MVP, let's update progress when a user CLICKS a verse (selection) as a strong signal.
    // We already do it on chapter load.

    const handleVerseLongPress = (verse: BibleVerse) => {
        setSelectedVerse(verse);
    };

    // Toggle header on tap if hidden (optional feature from request: "if tapped ... return it")
    const handleContainerClick = () => {
        if (!isHeaderVisible) {
            setIsHeaderVisible(true);
            setBottomNavVisible(true);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background p-4 text-center">
                <p className="text-red-500 mb-4">Thinking about the Word... (Failed to load)</p>
                <button onClick={onBack} className="text-primary underline">Go Back</button>
            </div>
        );
    }

    return (
        <div
            className="pb-20 pt-16 bg-background min-h-full transition-colors duration-300"
            onClick={handleContainerClick}
        >
            {/* Header */}
            <div
                className="fixed top-0 left-1/2 w-full max-w-md z-10 bg-surface/90 backdrop-blur-md border-b border-default px-4 py-3 flex items-center justify-between shadow-sm transition-transform duration-300"
                style={{ transform: `translate(-50%, ${isHeaderVisible ? '0' : '-100%'})` }}
            >
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 -ml-2 text-primary hover:bg-surface-highlight rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-primary">{book.name} {chapter}</h2>
                        <p className="text-xs text-secondary">Berean Study Bible</p>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }}
                    className="p-2 w-10 h-10 flex items-center justify-center text-primary font-serif font-bold hover:bg-surface-highlight rounded-full transition-colors"
                >
                    Aa
                </button>
            </div>

            {/* Verses */}
            <div className="px-5 py-6 space-y-4 max-w-xl mx-auto">
                {verses.map((verse) => (
                    <VerseItem
                        key={verse.verse}
                        verse={verse}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        isSelected={selectedVerse?.verse === verse.verse}
                        bookmarked={isBookmarked(book.id, chapter, verse.verse)}
                        onLongPress={handleVerseLongPress}
                        verseRefSetter={(id, el) => { verseRefs.current[id] = el; }}
                    />
                ))}
            </div>

            <div className="px-5 py-8 grid grid-cols-2 gap-4">
                <button
                    onClick={(e) => { e.stopPropagation(); onPrevious(); }}
                    disabled={isFirstChapter}
                    className={`text-primary font-semibold flex items-center justify-center gap-2 w-full py-4 bg-surface rounded-xl shadow-sm border border-default transition-all ${isFirstChapter ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:border-accent hover:text-accent'}`}
                >
                    <ArrowLeft size={20} />
                    Previous
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="text-primary font-semibold flex items-center justify-center gap-2 w-full py-4 bg-surface rounded-xl shadow-sm border border-default transition-all active:scale-95 hover:border-accent hover:text-accent"
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
                bookId={book.id}
                chapter={chapter}
                verse={selectedVerse?.verse || 0}
            />

            <BibleSettings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}
