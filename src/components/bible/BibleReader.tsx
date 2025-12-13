import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Bookmark } from 'lucide-react';
import { useChapter } from '../../hooks/useBible';
import type { BibleBook, BibleVerse } from '../../services/BibleService';
import { VerseActionMenu } from './VerseActionMenu';
import { useBibleSettings } from '../../contexts/BibleContext';
import { BibleSettings } from './BibleSettings';
import { VersionSelector } from './VersionSelector';
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
    isFlashing,
    bookmarked,
    onLongPress,
    verseRefSetter
}: {
    verse: BibleVerse;
    fontSize: number;
    fontFamily: string;
    isSelected: boolean;
    isFlashing: boolean;
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
            className={`relative group p-2 -mx-2 rounded-lg transition-all duration-1000 cursor-pointer select-none
                ${isSelected ? 'bg-surface-highlight border border-accent/20' : ''}
                ${isFlashing ? 'bg-gold/30' : 'hover:bg-surface-highlight/50 active:bg-surface-highlight'}
                ${bookmarked && !isFlashing ? 'bg-gold/5' : ''}
            `}
            data-verse={verse.verse}
        >
            {/* Verse Number */}
            <span className={`absolute -left-2 top-3 text-xs font-bold transition-colors duration-300 z-10 ${bookmarked ? 'text-gold' : 'text-accent opacity-60'}`}>
                {verse.verse}
            </span>

            {/* Bookmark Indicator (Icon + Subtle Shimmer) */}
            {bookmarked && (
                <>
                    <div className="absolute top-2 right-2 opacity-80">
                        <Bookmark size={14} className="fill-gold text-gold" />
                    </div>
                </>
            )}

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
    const { version, fontSize, fontFamily } = useBibleSettings();
    const { data, loading, error } = useChapter(version, book.id, chapter);
    const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { isBookmarked, saveProgress, markChapterCompleted } = useBibleProgress();
    const verses = data?.verses || [];
    const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    const [flashingVerse, setFlashingVerse] = useState<number | null>(null);

    // Immersive Mode State
    const { setBottomNavVisible } = useLayout();
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Scroll detection for immersive mode
    useEffect(() => {
        const onScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            // Ensure we are tracking the main scroll container
            if (target.id !== 'main-scroll-container') return;

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

        // Attach to the main scroll container directly
        const mainContainer = document.getElementById('main-scroll-container');
        if (mainContainer) {
            mainContainer.addEventListener('scroll', onScroll, { capture: true }); // Capture might not be needed if attached directly, but safe
        }

        return () => {
            if (mainContainer) {
                mainContainer.removeEventListener('scroll', onScroll, { capture: true });
            }
            setBottomNavVisible(true); // Reset on unmount
        };
    }, [setBottomNavVisible]);

    // Scroll to initial verse on load
    useEffect(() => {
        if (!loading && initialVerse && verseRefs.current[initialVerse]) {
            setTimeout(() => {
                // Flash the verse
                setFlashingVerse(initialVerse);

                // Scroll to top
                verseRefs.current[initialVerse]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Remove flash after animation
                setTimeout(() => {
                    setFlashingVerse(null);
                }, 2000);
            }, 500);
        }
    }, [loading, initialVerse]);

    const sentinelRef = useRef<HTMLDivElement>(null);

    // Progress Tracking (IntersectionObserver)
    useEffect(() => {
        if (loading || verses.length === 0) return;

        const observerCallback: IntersectionObserverCallback = (entries) => {
            entries.forEach(entry => {
                const target = entry.target as HTMLElement;

                // Verse Tracking
                if (target.getAttribute('data-verse')) {
                    if (entry.isIntersecting) {
                        const verseId = parseInt(target.getAttribute('data-verse') || '0');
                        if (verseId > 0) {
                            saveProgress({
                                bookId: book.id,
                                bookName: book.name,
                                chapter: chapter,
                                verse: verseId,
                                version: version // Pass version
                            });
                        }
                    }
                }

                // Chapter Completion (Sentinel)
                if (target === sentinelRef.current && entry.isIntersecting) {
                    console.log('Chapter Completed:', book.id, chapter);
                    markChapterCompleted(book.id, chapter, version); // Pass version
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, {
            root: document.getElementById('main-scroll-container'),
            rootMargin: '-20% 0px -20% 0px', // Center focused for verses
            threshold: 0.1
        });

        // Separate observer for Sentinel (more lenient)
        const sentinelObserver = new IntersectionObserver(observerCallback, {
            root: document.getElementById('main-scroll-container'),
            rootMargin: '100px 0px 0px 0px', // Trigger slightly before end
            threshold: 0.1
        });

        // Observe all verses
        Object.values(verseRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        // Observe sentinel
        if (sentinelRef.current) {
            sentinelObserver.observe(sentinelRef.current);
        }

        return () => {
            observer.disconnect();
            sentinelObserver.disconnect();
        };
    }, [loading, verses, book.id, chapter, saveProgress, markChapterCompleted]);

    // Handle container click for showing header
    const handleContainerClick = () => {
        if (!isHeaderVisible) {
            setIsHeaderVisible(true);
            setBottomNavVisible(true);
        }
    };

    // Scroll Helper
    const scrollToTop = () => {
        const mainContainer = document.getElementById('main-scroll-container');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }
    };

    const handleNext = () => {
        onNext();
        scrollToTop();
    };

    const handlePrevious = () => {
        onPrevious();
        scrollToTop();
    };

    const handleVerseLongPress = (verse: BibleVerse) => {
        setSelectedVerse(verse);
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
                <p className="text-red-500 mb-4 font-bold">Error loading chapter</p>
                <p className="text-xs text-red-400 font-mono mb-4 max-w-md break-words">{error.message}</p>
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
                        <h2 className="text-xl font-ancient font-bold text-gold uppercase tracking-widest leading-none">{book.name} {chapter}</h2>

                        {/* Version Selector */}
                        <div className="relative inline-block mt-0.5 z-50">
                            <VersionSelector variant="minimal" />
                        </div>

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
                        isFlashing={flashingVerse === verse.verse}
                        bookmarked={isBookmarked(book.id, chapter, verse.verse, version)}
                        onLongPress={handleVerseLongPress}
                        verseRefSetter={(id, el) => { verseRefs.current[id] = el; }}
                    />
                ))}
                {/* Sentinel for detection */}
                <div ref={sentinelRef} className="h-1 w-full" data-testid="chapter-end-sentinel" />
            </div>

            <div className="px-5 py-8 grid grid-cols-2 gap-4">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    disabled={isFirstChapter}
                    className={`text-primary font-semibold flex items-center justify-center gap-2 w-full py-4 bg-surface rounded-xl shadow-sm border border-default transition-all ${isFirstChapter ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:border-accent hover:text-accent'}`}
                >
                    <ArrowLeft size={20} />
                    Previous
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
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
