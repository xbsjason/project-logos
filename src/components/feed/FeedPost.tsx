import { useRef, useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music, CheckCircle2, MoreHorizontal, Repeat2 } from 'lucide-react';
import type { Post } from '../../data/mockData';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { UserStatsService } from '../../services/UserStatsService';
import { useNavigate, Link } from 'react-router-dom';
import { UserService } from '../../services/UserService';
import { clsx } from "clsx";

interface FeedPostProps {
    post: Post;
    isActive: boolean;
    isDetailView?: boolean;
}

export function FeedPost({ post, isActive, isDetailView = false }: FeedPostProps) {
    const navigate = useNavigate();

    // Safety check
    if (!post || !post.author) return null;

    const handlePostClick = () => {
        if (!isDetailView) navigate(`/post/${post.id}`);
    };

    return (
        <div className={`w-full bg-navy-950 flex flex-col ${isDetailView ? 'mb-4' : 'mb-8 border-b border-white/5 pb-4'}`}>
            {/* 1. Header */}
            <PostHeader post={post} />

            {/* 2. Content Body (4:5 Ratio) */}
            <div
                className="relative w-full aspect-[4/5] bg-black overflow-hidden mt-2"
                onClick={handlePostClick}
            >
                <PostContent post={post} isActive={isActive} />

                {/* Overlays (Song, etc) */}
                {post.song && (
                    <div className="absolute bottom-4 left-4 z-20">
                        <SongBadge song={post.song} />
                    </div>
                )}
            </div>

            {/* 3. Interactions */}
            <PostActions post={post} />

            {/* 4. Footer (Caption & Hashtags) */}
            <PostFooter post={post} isDetailView={isDetailView} />
        </div>
    );
}

// -- Subcomponents --

function PostHeader({ post }: { post: Post }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check follow status (only if logged in and not own post)
    useEffect(() => {
        if (!user || user.uid === post.authorId) return;

        UserService.isFollowing(user.uid, post.authorId).then(setIsFollowing);
    }, [user, post.authorId]);

    const handleFollow = async () => {
        if (!user || loading) return;
        setLoading(true);
        try {
            if (isFollowing) {
                await UserService.unfollowUser(user.uid, post.authorId);
                setIsFollowing(false);
            } else {
                await UserService.followUser(user.uid, post.authorId);
                setIsFollowing(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const timeDisplay = post.createdAt
        ? new Date().getTime() - new Date(post.createdAt).getTime() < 86400000
            ? '2h ago' // Mock relative time for now
            : 'Yesterday'
        : 'Just now';

    const getTypeLabel = () => {
        switch (post.type) {
            case 'verse_art': return 'VERSE ART';
            case 'prayer': return 'PRAYER';
            case 'praise': return 'PRAISE';
            case 'image': return 'IMAGE';
            case 'video': return 'VIDEO';
            case 'text': return 'THOUGHT';
            default: return post.type.toUpperCase();
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
                <div onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }} className="cursor-pointer">
                    <Avatar src={post.author.avatar} name={post.author.name} size="sm" className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span
                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }}
                            className="font-bold text-sm text-white cursor-pointer hover:underline"
                        >
                            {post.author.name}
                        </span>
                        <span className="text-[10px] font-bold text-secondary bg-white/10 px-1.5 rounded uppercase tracking-wider">
                            {getTypeLabel()}
                        </span>
                    </div>
                    <span className="text-xs text-secondary/70">{timeDisplay}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {user && user.uid !== post.authorId && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                        disabled={loading}
                        className={clsx(
                            "text-xs font-bold px-3 py-1 rounded-full transition-all",
                            isFollowing
                                ? "bg-white/10 text-white hover:bg-white/20"
                                : "bg-gold text-navy-950 hover:bg-gold-light"
                        )}
                    >
                        {loading ? "..." : isFollowing ? "Following" : "Follow"}
                    </button>
                )}

                <button className="p-2 text-secondary hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>
    );
}

function PostContent({ post, isActive }: { post: Post, isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(() => console.log('Autoplay blocked'));
        } else if (!isActive && videoRef.current) {
            videoRef.current.pause();
        }
    }, [isActive]);

    // Prayer/Praise/Text styling
    if (['prayer', 'praise', 'text'].includes(post.type)) {
        const isPrayer = post.type === 'prayer';
        const isPraise = post.type === 'praise';

        return (
            <div className={`w-full h-full flex flex-col justify-center items-center p-8 text-center relative
                ${isPraise ? 'bg-gradient-to-br from-green-950 via-navy-950 to-navy-900' : ''}
                ${isPrayer ? 'bg-gradient-to-br from-gold-950 via-navy-950 to-navy-900' : ''}
                ${post.type === 'text' ? 'bg-gradient-to-br from-navy-900 via-navy-950 to-black' : ''}
            `}>
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

                <div className="relative z-10 max-w-[90%]">
                    {post.type === 'text' && <div className="text-4xl text-gold/20 mb-4 font-serif">"</div>}

                    <h3 className={`font-serif text-2xl md:text-3xl leading-relaxed
                        ${isPraise ? 'text-green-100' : ''}
                        ${isPrayer ? 'text-gold-100' : ''}
                        ${post.type === 'text' ? 'text-cream-100' : ''}
                    `}>
                        {post.content}
                    </h3>

                    {post.type === 'text' && <div className="text-4xl text-gold/20 mt-4 font-serif">"</div>}

                    {(isPrayer || isPraise) && (
                        <div className="mt-8 flex justify-center">
                            <div className={`h-1 w-20 rounded-full ${isPraise ? 'bg-green-500/30' : 'bg-gold/30'}`} />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Video
    if (['video', 'worship', 'testimony'].includes(post.type)) {
        return (
            <video
                ref={videoRef}
                src={post.content}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
            />
        );
    }

    // Image / Verse Art
    // Spec: Verse Art 4:5, Image 4:5 (scaled/cropped)
    return (
        <img
            src={post.content}
            alt={post.caption || 'Post content'}
            className="w-full h-full object-cover"
            loading="lazy"
        />
    );
}


function PostActions({ post }: { post: Post }) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes || 0);
    const [bookmarked, setBookmarked] = useState(false);

    // Prayer specific
    const isPrayerPost = ['prayer', 'praise'].includes(post.type);
    const [prayed, setPrayed] = useState(false);
    const [__, setPrayerCount] = useState(post.prayerCount || 0);

    // Check captured like status if needed (optimistic for now)

    useEffect(() => {
        if (isPrayerPost && localStorage.getItem(`prayed_${post.id}`) === 'true') {
            setPrayed(true);
        }
    }, [post.id, isPrayerPost]);

    // Sync likes count with prop if it updates (e.g. from real-time listener in Detail view)
    useEffect(() => {
        setLikesCount(post.likes || 0);
    }, [post.likes]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return; // Prompt login?

        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(c => newLiked ? c + 1 : c - 1);

        try {
            if (newLiked) {
                await import('../../services/PostService').then(m => m.PostService.likePost(post.id, user.uid));
            } else {
                await import('../../services/PostService').then(m => m.PostService.unlikePost(post.id, user.uid));
            }
        } catch (err) {
            console.error("Like failed", err);
            // Revert
            setLiked(!newLiked);
            setLikesCount(c => !newLiked ? c + 1 : c - 1);
        }
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        setBookmarked(p => !p);
        if (user && !bookmarked) {
            UserStatsService.trackActivity(user.uid, 'bookmark', { postId: post.id });
        }
    };

    const handlePray = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (prayed) return;

        setPrayed(true);
        setPrayerCount(p => (p || 0) + 1);

        if (user) {
            try {
                await UserStatsService.incrementStat(user.uid, 'prayersCount');
                localStorage.setItem(`prayed_${post.id}`, 'true');
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {isPrayerPost ? (
                    <button
                        onClick={handlePray}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all active:scale-95 ${prayed
                            ? 'bg-gold text-navy-950 font-bold'
                            : 'bg-navy-800 text-gold border border-gold/30 hover:bg-navy-700'
                            }`}
                    >
                        {prayed ? <CheckCircle2 size={18} /> : <div className="text-lg">🙏</div>}
                        <span className="text-sm">{prayed ? 'Prayed' : 'I Pray'}</span>
                    </button>
                ) : (
                    <button onClick={handleLike} className="transition-transform active:scale-90 flex items-center gap-1 group">
                        <Heart
                            size={26}
                            className={liked ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-gray-300 transition-colors'}
                        />
                        {likesCount > 0 && <span className="text-xs text-gray-400 font-medium">{likesCount}</span>}
                    </button>
                )}

                <button className="text-white hover:text-gray-300 transition-transform active:scale-90">
                    <MessageCircle size={26} />
                </button>

                <button className="text-white hover:text-gray-300 transition-transform active:scale-90">
                    <Repeat2 size={26} />
                </button>

                <button className="text-white hover:text-gray-300 transition-transform active:scale-90">
                    <Share2 size={26} />
                </button>
            </div>

            <button onClick={handleBookmark} className="text-white hover:text-gray-300 transition-transform active:scale-90">
                <Bookmark size={26} className={bookmarked ? 'fill-white' : ''} />
            </button>
        </div>
    );
}


function PostFooter({ post, isDetailView }: { post: Post, isDetailView: boolean }) {
    const navigate = useNavigate();

    const handleReadMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/post/${post.id}`);
    };

    return (
        <div className="px-4 pb-2">
            {/* Likes / Prayers Count Line */}
            <div className="font-bold text-sm text-white mb-2">
                {['prayer', 'praise'].includes(post.type) ? (
                    <span>{post.prayerCount || 0} prayed</span>
                ) : (
                    <span>{post.likes} likes</span>
                )}
            </div>

            {/* Caption */}
            <div className="mb-2">
                <span className="font-bold text-sm text-white mr-2">{post.author.name}</span>
                <ClampedText text={post.caption} isDetailView={isDetailView} onReadMore={handleReadMore} />
            </div>

            {/* Verse Chip if exists (now in footer for cleaner image) */}
            {post.verse && (
                <div className="mt-2">
                    <VerseChip verse={post.verse} />
                </div>
            )}
        </div>
    );
}

function ClampedText({ text, isDetailView, onReadMore, lines = 2 }: { text: string, isDetailView: boolean, onReadMore: (e: React.MouseEvent) => void, lines?: number }) {
    if (!text) return null;

    const isLong = text.length > 100 || text.split('\n').length > lines;

    const renderContent = (content: string) => {
        const parts = content.split(/((?:#|@)[\w]+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('#')) {
                const tag = part.slice(1);
                return (
                    <Link
                        key={i}
                        to={`/tags/${tag.toLowerCase()}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 font-normal mr-1"
                    >
                        {part}
                    </Link>
                );
            }
            if (part.startsWith('@')) {
                const username = part.slice(1);
                return (
                    <Link
                        key={i}
                        to={`/profile/${username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-white font-semibold hover:underline mr-1"
                    >
                        {part}
                    </Link>
                );
            }
            return part;
        });
    };

    if (isDetailView || !isLong) {
        return <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{renderContent(text)}</p>;
    }

    return (
        <div className="inline">
            <span className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed line-clamp-2 inline">
                {renderContent(text)}
            </span>
            <button onClick={onReadMore} className="text-sm text-secondary hover:text-white ml-1 font-medium">
                more
            </button>
        </div>
    );
}

function SongBadge({ song }: { song: { title: string, artist: string } | undefined }) {
    if (!song) return null;
    return (
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 w-fit border border-white/10">
            <Music size={12} className="animate-spin-slow text-gold" />
            <div className="text-[10px] font-medium truncate max-w-[120px] text-cream-50">
                {song.title}
            </div>
        </div>
    );
}

function VerseChip({ verse }: { verse: { ref: string, text: string, id?: string } | undefined }) {
    if (!verse) return null;

    // Construct link URL
    // Format: /bible/kjv/BOOK/CHAPTER/VERSE
    // If we have id in "BOOK:CHAPTER:VERSE" format
    let linkUrl = '/bible';
    if (verse.id) {
        const parts = verse.id.split(':');
        if (parts.length >= 2) {
            linkUrl = `/bible/KJV/${parts[0]}/${parts[1]}${parts[2] ? '/' + parts[2] : ''}`;
        }
    } else {
        // Fallback parsing (very basic)
        // Ex: "John 3:16" -> "John", "3", "16"
        // This is complex to regex reliably, so we might just default to /bible if no ID
        // Or simplistic split
        const match = verse.ref.match(/^(.+)\s(\d+):(\d+)/);
        if (match) {
            // Ideally we need standard book IDs. 
            // For now, let's link to just bible root if no ID, or try best effort.
            linkUrl = `/bible`;
        }
    }

    return (
        <Link
            to={linkUrl}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 bg-navy-800/50 border border-navy-700 rounded px-2 py-1 text-xs hover:bg-navy-800 transition-colors cursor-pointer group"
        >
            <span className="font-bold text-gold group-hover:underline">{verse.ref}</span>
        </Link>
    );
}
