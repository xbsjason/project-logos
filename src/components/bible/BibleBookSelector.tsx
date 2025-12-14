import { useEffect, useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { BibleService, type BibleBook } from '../../services/BibleService';
import { offlineBibleService } from '../../services/OfflineBibleService';

interface BibleBookSelectorProps {
    books: BibleBook[];
    onSelectBook: (book: BibleBook) => void;
}


import { useBibleSettings } from '../../contexts/BibleContext';
import { useBibleProgress } from '../../contexts/BibleProgressContext';

export function BibleBookSelector({ books, onSelectBook }: BibleBookSelectorProps) {
    const { version } = useBibleSettings();
    const oldTestamentBooks = books.filter(b => b.testament === 'OT');
    const newTestamentBooks = books.filter(b => b.testament === 'NT');
    const [downloadStatus, setDownloadStatus] = useState<Record<string, 'idle' | 'downloading' | 'downloaded'>>({});
    const { isChapterCompleted } = useBibleProgress();

    const isBookCompleted = (book: BibleBook) => {
        // Check if all chapters are completed
        for (let i = 1; i <= book.chapterCount; i++) {
            if (!isChapterCompleted(book.id, i, version)) return false;
        }
        return true;
    };

    useEffect(() => {
        // Check initial status
        const checkStatus = async () => {
            const status: Record<string, 'idle' | 'downloading' | 'downloaded'> = {};
            // We'll check all books in parallel
            await Promise.all(books.map(async (book) => {
                const isDownloaded = await offlineBibleService.isBookDownloaded(version, book.id);
                if (isDownloaded) {
                    status[book.id] = 'downloaded';
                } else {
                    status[book.id] = 'idle';
                }
            }));
            setDownloadStatus(prev => ({ ...prev, ...status }));
        };
        checkStatus();
    }, [books]);

    const handleDownload = async (e: React.MouseEvent, book: BibleBook) => {
        e.stopPropagation(); // Prevent opening the book
        if (downloadStatus[book.id] === 'downloaded' || downloadStatus[book.id] === 'downloading') return;

        setDownloadStatus(prev => ({ ...prev, [book.id]: 'downloading' }));

        try {
            await BibleService.checkAndDownloadBook(version, book.id);
            setDownloadStatus(prev => ({ ...prev, [book.id]: 'downloaded' }));
        } catch (error) {
            console.error('Download failed', error);
            setDownloadStatus(prev => ({ ...prev, [book.id]: 'idle' }));
        }
    };

    const renderBookButton = (book: BibleBook) => {
        const status = downloadStatus[book.id] || 'idle';
        const completed = isBookCompleted(book);

        return (
            <button
                key={book.id}
                onClick={() => onSelectBook(book)}
                className={`relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 active:scale-95 border group text-left ${completed
                        ? "bg-gold/10 border-gold text-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                        : "bg-surface border-default text-primary hover:border-gold/50 hover:shadow-lg hover:-translate-y-1 shadow-sm"
                    }`}
            >
                <div>
                    <span className={`font-serif text-lg font-bold transition-colors ${!completed && "group-hover:text-gold"}`}>
                        {book.name}
                    </span>
                    {completed && <div className="text-[10px] uppercase tracking-widest opacity-60 font-sans mt-0.5">Completed</div>}
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${completed ? "bg-gold/20 text-gold" : "text-secondary bg-surface-highlight"
                        }`}>
                        {book.chapterCount} ch
                    </span>
                    <div
                        onClick={(e) => handleDownload(e, book)}
                        className={`p-2 rounded-full transition-colors ${completed ? "hover:bg-gold/20 text-gold" : "hover:bg-surface-highlight text-secondary"
                            }`}
                    >
                        {status === 'downloading' ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : status === 'downloaded' ? (
                            <Check size={18} />
                        ) : (
                            <Download size={18} className="opacity-40 hover:opacity-100 group-hover:opacity-70 transition-opacity" />
                        )}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto pb-32 bg-background transition-colors duration-300">
            <div className="px-6 space-y-8">
                {/* Old Testament */}
                <section>
                    <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">
                        Old Testament
                    </h2>
                    <div className="grid grid-cols-1 gap-2">
                        {oldTestamentBooks.map(renderBookButton)}
                    </div>
                </section>

                {/* New Testament */}
                <section>
                    <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">
                        New Testament
                    </h2>
                    <div className="grid grid-cols-1 gap-2">
                        {newTestamentBooks.map(renderBookButton)}
                    </div>
                </section>
            </div>
        </div>
    );
}
