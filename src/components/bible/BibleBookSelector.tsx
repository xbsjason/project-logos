import { useEffect, useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { BibleService, type BibleBook } from '../../services/BibleService';
import { offlineBibleService } from '../../services/OfflineBibleService';

interface BibleBookSelectorProps {
    books: BibleBook[];
    onSelectBook: (book: BibleBook) => void;
}

export function BibleBookSelector({ books, onSelectBook }: BibleBookSelectorProps) {
    const oldTestamentBooks = books.filter(b => b.order <= 39);
    const newTestamentBooks = books.filter(b => b.order > 39);
    const [downloadStatus, setDownloadStatus] = useState<Record<string, 'idle' | 'downloading' | 'downloaded'>>({});

    useEffect(() => {
        // Check initial status
        const checkStatus = async () => {
            const status: Record<string, 'idle' | 'downloading' | 'downloaded'> = {};
            // We'll check all books in parallel
            await Promise.all(books.map(async (book) => {
                const isDownloaded = await offlineBibleService.isBookDownloaded(book.id);
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
            await BibleService.checkAndDownloadBook(book.id);
            setDownloadStatus(prev => ({ ...prev, [book.id]: 'downloaded' }));
        } catch (error) {
            console.error('Download failed', error);
            setDownloadStatus(prev => ({ ...prev, [book.id]: 'idle' }));
        }
    };

    const renderBookButton = (book: BibleBook) => {
        const status = downloadStatus[book.id] || 'idle';

        return (
            <button
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="relative flex items-center justify-between p-4 bg-surface rounded-xl shadow-sm border border-default active:scale-[0.98] hover:border-accent transition-all group"
            >
                <span className="font-serif text-lg text-primary group-hover:text-gold transition-colors">{book.name}</span>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-secondary bg-surface-highlight px-2 py-1 rounded-full">
                        {book.chapterCount} ch
                    </span>
                    <div
                        onClick={(e) => handleDownload(e, book)}
                        className="p-2 rounded-full hover:bg-surface-highlight transition-colors text-secondary"
                    >
                        {status === 'downloading' ? (
                            <Loader2 size={18} className="animate-spin text-accent" />
                        ) : status === 'downloaded' ? (
                            <Check size={18} className="text-green-500" />
                        ) : (
                            <Download size={18} className="opacity-40 hover:opacity-100 group-hover:opacity-70 transition-opacity" />
                        )}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto pb-20 bg-background transition-colors duration-300">
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
