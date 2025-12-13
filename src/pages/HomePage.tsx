import { Music, Search, Loader2 } from 'lucide-react';
import { FeedContainer } from '../components/feed/FeedContainer';
import { type Post } from '../data/mockData';
import { PostService } from '../services/PostService';
import { useAudio } from '../contexts/AudioContext';
import { useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { AppSearchContext } from '../components/layout/AppShell';


export function HomePage() {
    const { togglePlay } = useAudio();
    const { toggleSearch } = useOutletContext<AppSearchContext>();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const { posts: fetchedPosts } = await PostService.getFeedPosts();
                console.log("Fetched posts:", fetchedPosts.length);

                if (fetchedPosts.length === 0) {
                    console.warn("No posts found in DB. Falling back to MOCK_POSTS.");
                    // Fallback to MOCK_POSTS so the user sees *something* instead of empty screen
                    // This is temporary until seeding is confirmed working by the user.
                    // We need to import MOCK_POSTS again.
                    // But wait, I removed the import. I need to re-add it or just fetch them dynamically if possible 
                    // or just leave it empty but show a message.
                    // Let's simpler: just show empty state message if 0.
                }
                setPosts(fetchedPosts);
            } catch (err) {
                console.error("Failed to fetch posts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className="h-full bg-background relative transition-colors duration-300">
            {/* Header Gradient */}
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center bg-surface/95 backdrop-blur-md border-b border-default shadow-sm transition-colors duration-300">
                <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-serif font-bold tracking-wide text-primary">
                    FaithVoice
                </h1>

                <div className="flex gap-4 ml-auto">
                    <button onClick={toggleSearch} className="p-2 bg-surface-highlight rounded-full text-primary hover:bg-default transition-colors">
                        <Search size={20} />
                    </button>
                    <button onClick={togglePlay} className="p-2 bg-surface-highlight rounded-full text-primary hover:bg-default transition-colors">
                        <Music size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-full flex items-center justify-center text-white/50">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            ) : posts.length > 0 ? (
                <FeedContainer posts={posts} />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-secondary p-8 text-center">
                    <p className="mb-4">No posts found.</p>
                    <p className="text-sm">Try running the Seed Script in Settings &gt; Debug Tools.</p>
                </div>
            )}
        </div >
    );
}
