
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MOCK_POSTS, MOCK_PRAYERS, type Post } from '../../data/mockData'; // TODO: Switch to real service later
import { FeedPost } from '../../components/feed/FeedPost';
import {
    // useMemo
} from 'react';

export function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();

    // TODO: Fetch real post by ID from Firestore
    // For now, find in mock data
    const post = MOCK_POSTS.find(p => p.id === postId) ||
        MOCK_PRAYERS.find(p => p.id === postId) as unknown as Post; // Type casting for now, will fix with real types

    // If strictly checking IDs not found:
    if (!post && !postId?.startsWith('prayer-')) {
        // handle not found or loading
    }

    // Mock finding for mixed Types if we were using the same ID space or similar
    // This is temporary until we have the PostService.

    return (
        <div className="h-full bg-background flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-white/5 bg-navy-950 z-10 sticky top-0">
                <button onClick={() => navigate(-1)} className="text-white p-2 -ml-2">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-white font-bold text-lg ml-2">Post</h1>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto">
                {post ? (
                    <div className="pb-20">
                        {/* We reuse FeedPost but force full display mode via a prop we will add 'isDetailView' */}
                        <FeedPost post={post} isActive={true} isDetailView={true} />

                        {/* Comments Section Placeholder */}
                        <div className="p-4 text-white/50 text-center text-sm mt-4 border-t border-white/5">
                            Comments coming soon...
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-secondary">
                        Post not found {postId}
                    </div>
                )}
            </div>
        </div>
    );
}
