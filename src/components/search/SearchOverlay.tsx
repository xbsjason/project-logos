import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowRight, User, Hash, FileText, Loader2, Heart } from 'lucide-react';
import { SUGGESTED_SEARCHES } from '../../data/search/searchData';
import { Link } from 'react-router-dom';
import { SearchService, type SearchResultItem } from '../../services/SearchService';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery(''); // Reset query on close
            setResults([]);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Debounced search function
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const searchResults = await SearchService.searchAll(searchQuery);
            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search effect
    useEffect(() => {
        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!query.trim()) {
            setResults([]);
            return;
        }

        // Set loading immediately for better UX
        setLoading(true);

        // Debounce the actual search
        debounceRef.current = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, performSearch]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-cream-50/95 dark:bg-navy-900/95 backdrop-blur-xl animate-in fade-in duration-200 flex flex-col">
            {/* Header / Search Bar */}
            <div className="pt-safe-top px-4 pb-2 border-b border-cream-200 dark:border-navy-700 bg-white/50 dark:bg-navy-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 max-w-md mx-auto pt-4 pb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search users, posts, hashtags..."
                            className="w-full bg-cream-100 dark:bg-navy-800 border-none rounded-2xl py-4 pl-12 pr-4 text-lg font-medium text-navy dark:text-cream-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/20"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-cream-200 dark:bg-navy-700 text-navy dark:text-cream-50 hover:bg-cream-300 dark:hover:bg-navy-600 transition-colors"
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
                                        className="px-4 py-2 bg-white dark:bg-navy-800 rounded-full text-navy dark:text-cream-50 border border-cream-200 dark:border-navy-700 text-sm font-medium hover:border-gold/50 hover:bg-cream-50 dark:hover:bg-navy-700 transition-colors"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {query && loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-gold" size={32} />
                        </div>
                    )}

                    {/* Results */}
                    {query && !loading && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            {results.length > 0 ? (
                                <>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                        {results.length} Result{results.length !== 1 ? 's' : ''}
                                    </h3>
                                    <div className="space-y-2">
                                        {results.map((result) => (
                                            <Link
                                                key={result.id}
                                                to={result.link}
                                                onClick={onClose}
                                                className="flex items-center gap-4 p-4 bg-white dark:bg-navy-800 rounded-2xl border border-cream-200 dark:border-navy-700 active:scale-[0.98] transition-all hover:shadow-sm group"
                                            >
                                                {/* Avatar or Icon */}
                                                {result.avatar ? (
                                                    <img
                                                        src={result.avatar}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full object-cover shrink-0 bg-cream-100 dark:bg-navy-700"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-cream-100 dark:bg-navy-700 flex items-center justify-center shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                                                        {getIconForType(result.type)}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-navy dark:text-cream-50 truncate">{result.title}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
                                                </div>
                                                <ArrowRight size={16} className="text-gray-300 group-hover:text-gold" />
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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

function getIconForType(type: SearchResultItem['type']) {
    switch (type) {
        case 'user': return <User size={20} />;
        case 'hashtag': return <Hash size={20} />;
        case 'post': return <FileText size={20} />;
        case 'prayer': return <Heart size={20} />;
        default: return <Search size={20} />;
    }
}
