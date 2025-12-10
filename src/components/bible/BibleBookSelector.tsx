import { BIBLE_BOOKS, type BibleBook } from '../../data/bible/bibleData';

interface BibleBookSelectorProps {
    onSelectBook: (book: BibleBook) => void;
}

export function BibleBookSelector({ onSelectBook }: BibleBookSelectorProps) {
    return (
        <div className="p-4 grid grid-cols-3 gap-3">
            {BIBLE_BOOKS.map((book) => (
                <button
                    key={book.id}
                    onClick={() => onSelectBook(book)}
                    className="p-4 bg-white rounded-lg shadow-sm border border-cream-200 text-center active:bg-cream-100 active:scale-95 transition-all"
                >
                    <div className="font-bold text-navy text-lg">{book.id}</div>
                    <div className="text-xs text-gray-500 mt-1">{book.name}</div>
                </button>
            ))}
        </div>
    );
}
