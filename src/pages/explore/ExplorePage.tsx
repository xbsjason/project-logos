import { Search, Loader2 } from 'lucide-react';
import { PostService } from '../../services/PostService';
import { type Post } from '../../data/mockData';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Trending', 'Worship', 'Study', 'Testimony', 'Art'];

export function ExplorePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

    const handleImgError = (postId: string) => {
        setImgErrors(prev => ({ ...prev, [postId]: true }));
    };

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const { posts: fetchedPosts } = await PostService.getFeedPosts(undefined, 40);
                setPosts(fetchedPosts);
            } catch (err) {
                console.error("Explore fetch error:", err);
                setError("Failed to load content. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'prayer': return 'bg-gold text-white';
            case 'praise': return 'bg-green-600 text-white';
            case 'verse_art': return 'bg-navy-800 text-gold';
            case 'image': return 'bg-purple-600 text-white';
            case 'video': return 'bg-red-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    return (
        <div className="pb-20 bg-background min-h-full transition-colors duration-300">
            {/* Search Header */}
            <div className="sticky top-0 z-10 bg-surface border-b border-default px-4 py-3 shadow-sm transition-colors duration-300">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                    <input
                        type="text"
                        placeholder="Search tags, people, scripture..."
                        className="w-full pl-10 pr-4 py-2 bg-surface-highlight rounded-xl text-primary placeholder:text-secondary outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                    {CATEGORIES.map((cat, i) => (
                        <button
                            key={cat}
                            className={`
                px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors
                ${i === 0 ? 'bg-primary text-inverse' : 'bg-surface border border-default text-secondary hover:text-primary hover:border-accent'}
              `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Masonry Grid */}
            {loading ? (
                <div className="flex justify-center p-8 text-secondary">
                    <Loader2 className="animate-spin" />
                </div>
            ) : posts.length > 0 ? (
                <div className="p-2 grid grid-cols-2 gap-2">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => navigate(`/post/${post.id}`)}
                            className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-highlight group cursor-pointer active:scale-95 transition-transform"
                        >
                            {/* Type Badge */}
                            <div className={`absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${getTypeBadge(post.type)}`}>
                                {post.type === 'verse_art' ? 'Verse' : post.type}
                            </div>

                            {(post.type === 'video' || post.type === 'image' || post.type === 'verse_art' || post.type === 'prayer') ? (
                                <img
                                    src={
                                        imgErrors[post.id]
                                            ? 'https://images.unsplash.com/photo-1507643179173-61bba695f361?w=400&auto=format&fit=crop&q=60' // Fallback
                                            : (post.type === 'prayer' ? `https://ui-avatars.com/api/?name=${post.author?.name || 'User'}&background=random` : post.content)
                                    }
                                    className={`w-full h-full ${post.type === 'prayer' ? 'object-contain p-4 bg-white/5' : 'object-cover'}`}
                                    alt=""
                                    onError={() => handleImgError(post.id)}
                                />
                            ) : (
                                <div className="w-full h-full bg-surface p-4 flex items-center justify-center text-center">
                                    <p className="text-primary text-xs line-clamp-6 leading-relaxed font-serif">"{post.content}"</p>
                                </div>
                            )}

                            {/* Prayer Overlay Special */}
                            {['prayer', 'praise'].includes(post.type) && (
                                <div className="absolute inset-0 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-[1px]">
                                    <p className="text-white text-xs text-center font-serif line-clamp-5">
                                        "{post.content}"
                                    </p>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <p className="text-xs font-bold truncate">@{post.author?.name || 'faithvoice'}</p>
                                <p className="text-[10px] truncate">{post.likes} likes</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-secondary text-center mt-10">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-sm underline">Try Again</button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 text-secondary text-center mt-10">
                    <p>No content to explore yet.</p>
                    <p className="text-sm mt-2">Try seeding the database!</p>
                </div>
            )}
        </div>
    );
}
