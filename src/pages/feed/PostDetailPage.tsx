
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { FeedPost } from '../../components/feed/FeedPost';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import type { Post } from '../../data/mockData';

interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: any;
}

export function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const commentsEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Post
    useEffect(() => {
        if (!postId) return;
        setLoading(true);

        const docRef = doc(db, 'posts', postId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setPost({ id: docSnap.id, ...docSnap.data() } as Post);
            } else {
                setPost(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching post:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    // 2. Fetch Comments
    useEffect(() => {
        if (!postId) return;

        const q = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments: Comment[] = [];
            snapshot.forEach((doc) => {
                fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
            });
            setComments(fetchedComments);
            // Optional: scroll to bottom on initial load only? Or always?
            // Usually mainly on new messages. 
        });

        return () => unsubscribe();
    }, [postId]);

    // Auto-scroll to bottom of comments when added
    useEffect(() => {
        if (comments.length > 0) {
            // contentScrollerRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments.length]); // Simple trigger

    const handleAddComment = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newComment.trim() || !user || !postId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'posts', postId, 'comments'), {
                text: newComment.trim(),
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorAvatar: user.photoURL || null,
                createdAt: serverTimestamp()
            });
            setNewComment('');
        } catch (error) {
            console.error("Failed to add comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-navy-950 flex items-center justify-center text-white">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="h-screen bg-navy-950 flex flex-col items-center justify-center text-white gap-4">
                <p>Post not found.</p>
                <button onClick={() => navigate(-1)} className="text-gold font-bold">Go Back</button>
            </div>
        );
    }

    return (
        <div className="h-full bg-navy-950 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-white/5 bg-navy-950 z-10 shrink-0">
                <button onClick={() => navigate(-1)} className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="ml-2 flex flex-col">
                    <span className="text-white font-bold text-sm uppercase tracking-wider">{post.author?.name}'s Post</span>
                </div>
            </div>

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <div className="pb-4">

                    {/* The Post Itself */}
                    <FeedPost post={post} isActive={true} isDetailView={true} />

                    {/* Comments Divider */}
                    <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments</span>
                        <div className="h-px bg-white/5 flex-1" />
                    </div>

                    {/* Comments List */}
                    <div className="px-4 space-y-4">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 italic text-sm">
                                Be the first to share your thoughts...
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar src={comment.authorAvatar} name={comment.authorName} size="sm" className="w-8 h-8 shrink-0 mt-1" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-bold text-white">{comment.authorName}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {/* Simple timestamp logic */}
                                                {comment.createdAt?.seconds
                                                    ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString()
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={commentsEndRef} />
                    </div>
                </div>
            </div>

            {/* Comment Input Area - Flex bottom, not fixed viewport */}
            <div className="bg-navy-950 border-t border-white/10 p-3 pb-safe shrink-0 z-50">
                <form onSubmit={handleAddComment} className="flex items-center gap-3 max-w-2xl mx-auto">
                    <Avatar
                        src={user?.photoURL || undefined}
                        name={user?.displayName || 'Me'}
                        size="sm"
                        className="w-8 h-8 shrink-0"
                    />
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-navy-900 border border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-gold text-navy-950 rounded-full disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400 transition-all hover:scale-105 active:scale-95"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
