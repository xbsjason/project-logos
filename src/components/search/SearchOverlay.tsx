import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowRight, BookOpen, User, MessageCircle, Hash } from 'lucide-react';
import { MOCK_SEARCH_RESULTS, SUGGESTED_SEARCHES, type SearchResult } from '../../data/search/searchData';
import { Link } from 'react-router-dom';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery(''); // Reset query on close
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Mock search logic
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const filtered = MOCK_SEARCH_RESULTS.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
    }, [query]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-cream-50/95 backdrop-blur-xl animate-in fade-in duration-200 flex flex-col">
            {/* Header / Search Bar */}
            <div className="pt-safe-top px-4 pb-2 border-b border-cream-200 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 max-w-md mx-auto pt-4 pb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search bible, sermons, people..."
                            className="w-full bg-cream-100 border-none rounded-2xl py-4 pl-12 pr-4 text-lg font-medium text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/20"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-cream-200 text-navy hover:bg-cream-300 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-md mx-auto space-y-8">

                    {/* Empty State / Suggestions */}
                    {!query && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300 delay-100">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Suggested</h3>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_SEARCHES.map(term => (
                                    <button
                                        key={term}
                                        onClick={() => setQuery(term)}
                                        className="px-4 py-2 bg-white rounded-full text-navy border border-cream-200 text-sm font-medium hover:border-gold/50 hover:bg-cream-50 transition-colors"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {query && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            {results.length > 0 ? (
                                <>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                        Top Matches
                                    </h3>
                                    <div className="space-y-2">
                                        {results.map((result) => (
                                            <Link
                                                key={result.id}
                                                to={result.link}
                                                onClick={onClose}
                                                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-cream-200 active:scale-[0.98] transition-all hover:shadow-sm group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                                                    {getIconForType(result.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-navy truncate">{result.title}</h4>
                                                    <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                                </div>
                                                <ArrowRight size={16} className="text-gray-300 group-hover:text-gold" />
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No results found for "{query}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function getIconForType(type: SearchResult['type']) {
    switch (type) {
        case 'verse': return <BookOpen size={20} />;
        case 'user': return <User size={20} />;
        case 'topic': return <Hash size={20} />;
        case 'sermon': return <MessageCircle size={20} />;
        default: return <Search size={20} />;
    }
}
