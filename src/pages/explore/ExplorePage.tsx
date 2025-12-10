import { Search } from 'lucide-react';
import { MOCK_POSTS } from '../../data/mockData';

const CATEGORIES = ['Trending', 'Worship', 'Study', 'Testimony', 'Art'];

export function ExplorePage() {
    return (
        <div className="pb-20 bg-cream-50 min-h-full">
            {/* Search Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-cream-200 px-4 py-3 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search tags, people, scripture..."
                        className="w-full pl-10 pr-4 py-2 bg-cream-100 rounded-xl text-navy placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-gold/50"
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                    {CATEGORIES.map((cat, i) => (
                        <button
                            key={cat}
                            className={`
                px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap
                ${i === 0 ? 'bg-navy text-white' : 'bg-white border border-cream-200 text-gray-600'}
              `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Masonry Grid (Simulated with columns) */}
            <div className="p-2 grid grid-cols-2 gap-2">
                {MOCK_POSTS.map((post) => (
                    <div key={post.id} className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-200 group">
                        {post.type === 'video' || post.type === 'image' ? (
                            <img src={post.content} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-navy p-4 flex items-center justify-center text-center">
                                <p className="text-white text-xs line-clamp-4 leading-relaxed font-serif">"{post.content}"</p>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs font-bold truncate">@{post.author.name}</p>
                            <p className="text-[10px] truncate">{post.likes} likes</p>
                        </div>
                    </div>
                ))}
                {/* Duplicate mock data to fill grid */}
                {MOCK_POSTS.map((post) => (
                    <div key={`${post.id}-dup`} className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-200 group">
                        <img src={post.content} className="w-full h-full object-cover" alt="" />
                    </div>
                ))}
            </div>
        </div>
    );
}
