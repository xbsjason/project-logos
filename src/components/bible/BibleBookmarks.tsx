import { Bookmark as BookmarkIcon, ArrowLeft, Trash2 } from 'lucide-react';
import type { Bookmark } from '../../services/BibleProgressService';
import { useBibleProgress } from '../../contexts/BibleProgressContext';

interface BibleBookmarksProps {
    onBack: () => void;
    onSelectBookmark: (bookmark: Bookmark) => void;
}

import { useBibleSettings } from '../../contexts/BibleContext';

export function BibleBookmarks({ onBack, onSelectBookmark }: BibleBookmarksProps) {
    const { bookmarks, toggleBookmark } = useBibleProgress();
    const { version } = useBibleSettings();

    // Filter bookmarks by version
    const filteredBookmarks = bookmarks.filter(b => (b.version || 'bsb') === version);

    return (
        <div className="min-h-full bg-background transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-default px-4 py-3 flex items-center gap-2 shadow-sm">
                <button onClick={onBack} className="p-2 -ml-2 text-primary hover:bg-surface-highlight rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-primary">Bookmarks</h2>
                    <p className="text-xs text-secondary">{filteredBookmarks.length} saved verses ({version.toUpperCase()})</p>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
                {filteredBookmarks.length === 0 ? (
                    <div className="text-center py-12 text-secondary">
                        <BookmarkIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No bookmarks yet.</p>
                        <p className="text-sm mt-2">Tap a verse to add one.</p>
                    </div>
                ) : (
                    filteredBookmarks.map((bookmark) => (
                        <div
                            key={bookmark.id}
                            className="bg-surface border border-default rounded-xl p-4 flex items-start justify-between group active:scale-[0.99] transition-all"
                        >
                            <div
                                className="flex-1 cursor-pointer"
                                onClick={() => onSelectBookmark(bookmark)}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-primary">{bookmark.bookName} {bookmark.chapter}:{bookmark.verse}</span>
                                    <span className="text-xs px-2 py-0.5 bg-background text-secondary rounded-full border border-default uppercase">
                                        {bookmark.version || 'bsb'}
                                    </span>
                                </div>
                                <p className="text-sm text-secondary truncate">
                                    {/* Ideally we would show the verse text here, but we might not have it stored.
                                        For now, just showing the reference is okay. 
                                        Maybe update this later to store text in bookmark.
                                    */}
                                    View verse...
                                </p>
                                <p className="text-[10px] text-secondary/60 mt-2">
                                    {bookmark.createdAt?.toDate ? bookmark.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                </p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(bookmark);
                                }}
                                className="p-2 text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
