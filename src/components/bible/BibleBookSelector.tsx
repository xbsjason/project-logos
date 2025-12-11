import type { BibleBook } from '../../services/BibleService';

interface BibleBookSelectorProps {
    books: BibleBook[];
    onSelectBook: (book: BibleBook) => void;
}

export function BibleBookSelector({ books, onSelectBook }: BibleBookSelectorProps) {
    const oldTestamentBooks = books.filter(b => b.order <= 39); // Standard OT count
    const newTestamentBooks = books.filter(b => b.order > 39);

    return (
        <div className="flex-1 overflow-y-auto pb-20">
            <div className="px-6 space-y-8">
                {/* Old Testament */}
                <section>
                    <h2 className="text-xs font-bold text-navy/40 uppercase tracking-widest mb-4">
                        Old Testament
                    </h2>
                    <div className="grid grid-cols-1 gap-2">
                        {oldTestamentBooks.map((book) => (
                            <button
                                key={book.id}
                                onClick={() => onSelectBook(book)}
                                className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100 active:scale-[0.98] transition-all"
                            >
                                <span className="font-serif text-lg text-navy">{book.name}</span>
                                <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                                    {book.chapterCount} ch
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* New Testament */}
                <section>
                    <h2 className="text-xs font-bold text-navy/40 uppercase tracking-widest mb-4">
                        New Testament
                    </h2>
                    <div className="grid grid-cols-1 gap-2">
                        {newTestamentBooks.map((book) => (
                            <button
                                key={book.id}
                                onClick={() => onSelectBook(book)}
                                className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100 active:scale-[0.98] transition-all"
                            >
                                <span className="font-serif text-lg text-navy">{book.name}</span>
                                <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                                    {book.chapterCount} ch
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
