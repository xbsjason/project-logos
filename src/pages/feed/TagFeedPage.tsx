import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { FeedContainer } from '../../components/feed/FeedContainer';
import { PostService } from '../../services/PostService';
import { useEffect, useState } from 'react';
import type { Post } from '../../data/mockData';

export function TagFeedPage() {
    const { tag } = useParams();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!tag) return;
            setLoading(true);
            const fetched = await PostService.getPostsByTag(tag);
            setPosts(fetched);
            setLoading(false);
        };
        fetchPosts();
    }, [tag]);

    return (
        <div className="h-full bg-background flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-white/5 bg-navy-950 z-10 sticky top-0">
                <button onClick={() => navigate(-1)} className="text-white p-2 -ml-2">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-white font-bold text-lg ml-2">#{tag}</h1>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/50" />
                </div>
            ) : (
                <FeedContainer posts={posts} />
            )}
        </div>
    );
}
