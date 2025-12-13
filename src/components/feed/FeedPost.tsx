import { useRef, useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music, CheckCircle2 } from 'lucide-react';
import type { Post } from '../../data/mockData';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { UserStatsService } from '../../services/UserStatsService';
import { useNavigate, Link } from 'react-router-dom';

interface FeedPostProps {
    post: Post;
    isActive: boolean;
    isDetailView?: boolean;
}

export function FeedPost({ post, isActive, isDetailView = false }: FeedPostProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();

    // Safety check for critical data
    if (!post || !post.author) {
        return null;
    }

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(() => {
                console.log('Autoplay blocked');
            });
        } else if (!isActive && videoRef.current) {
            videoRef.current.pause();
        }
    }, [isActive]);

    const handleReadMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/post/${post.id}`);
    };
    // -- Layout 1: Video / Worship / Testimony / Text (Full Screen Style) --
    if (['video', 'worship', 'testimony', 'text'].includes(post.type)) {
        return (
            <div className={`relative w-full bg-navy-950 shrink-0 overflow-hidden rounded-3xl ${isDetailView ? 'min-h-[50vh] mb-4' : 'aspect-[9/16] min-h-[600px]'}`}>
                {/* Background Media */}
                <div className="absolute inset-0 bg-black">
                    {['video', 'worship', 'testimony'].includes(post.type) && (
                        <video
                            ref={videoRef}
                            src={post.content}
                            className="w-full h-full object-cover opacity-90"
                            loop
                            muted
                            playsInline
                        />
                    )}
                    {post.type === 'text' && (
                        <div className="w-full h-full flex flex-col justify-center items-center p-8 bg-gradient-to-br from-navy to-navy-light text-center">
                            <p className="text-2xl font-serif text-cream-100 leading-relaxed">
                                "{post.content}"
                            </p>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-navy-950/10 via-transparent to-navy-950/60 pointer-events-none" />
                </div>

                {/* Right Action Bar */}
                <RightActionBar post={post} />

                {/* Bottom Info Area */}
                <div className="absolute bottom-16 left-4 right-16 z-20 text-white pointer-events-none">
                    <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                        <h3 className="font-bold text-shadow-sm">@{post.author.name}</h3>
                        <span className="text-xs bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">Follow</span>
                    </div>

                    <div className="mb-3 drop-shadow-md">
                        <ClampedText text={post.caption} isDetailView={isDetailView} onReadMore={handleReadMore} />
                    </div>

                    {/* Attachments */}
                    {post.song && <SongBadge song={post.song} />}
                    {post.verse && <VerseChip verse={post.verse} />}
                </div>
            </div>
        );
    }

    // -- Layout 2: Verse Art (Tall Image Card) --
    // Also handling generic 'image' posts here with new sizing rules
    if (post.type === 'verse_art' || post.type === 'image') {
        const [imgError, setImgError] = useState(false);

        // Handle Image Click (Detail View)
        const handleImageClick = () => {
            if (!isDetailView) navigate(`/post/${post.id}`);
        };

        return (

            <div className={`w-full py-2 ${isDetailView ? 'px-0' : 'px-0'}`}>
                <div
                    className="relative w-full rounded-3xl overflow-hidden shadow-lg bg-surface border border-default group transition-colors duration-300 flex justify-center bg-black/5 dark:bg-black/20"
                    style={{
                        minHeight: '300px'
                    }}
                    onClick={handleImageClick}
                >
                    {/* Placeholder for Error */}
                    {imgError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950 text-secondary flex-col gap-2 z-20">
                            <div className="p-4 rounded-full bg-navy-700/50">
                                <Bookmark size={32} className="text-navy-300" />
                            </div>
                            <p className="text-xs font-medium text-navy-200">Image unavailable</p>
                        </div>
                    )}

                    {!imgError && (
                        <img
                            src={post.content}
                            alt={post.caption}
                            // No logic needed for aspectRatio anymore
                            onError={() => setImgError(true)}
                            // New logic: fit within container but allowed to be naturally wide or tall
                            // object-contain ensures we never clip. w-full h-full ensures we use space.
                            className="w-full h-auto object-contain relative z-10"
                            style={{
                                // In detail view, let it flow naturally
                                maxHeight: 'none'
                            }}
                        />
                    )}

                    {/* Overlay Gradient at bottom for text readability - Show even on error for consistency if we wanted, but the error bg handles contrast */}
                    {!imgError && (
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20" />
                    )}

                    {/* Right Actions (Floating) - Ensure z-index is above image */}
                    <div className="absolute right-2 bottom-8 z-30">
                        <RightActionBar post={post} compact />
                    </div>

                    {/* Bottom Content */}
                    <div className={`absolute bottom-4 left-4 right-14 z-20 pointer-events-none ${imgError ? 'text-primary' : 'text-white'}`}>
                        <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                            <Avatar src={post.author.avatar} name={post.author.name} size="sm" className="w-6 h-6 ring-0 shadow-none" />
                            <h3 className="font-bold text-sm text-shadow-sm">@{post.author.name}</h3>
                        </div>

                        <div className="mb-2 drop-shadow-md pointer-events-auto">
                            <ClampedText text={post.caption} isDetailView={isDetailView} onReadMore={handleReadMore} />
                        </div>

                        <div className="pointer-events-auto">
                            {post.verse && <VerseChip verse={post.verse} />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -- Layout 3: Prayer / Praise (Text Card) --
    if (['prayer', 'praise'].includes(post.type)) {
        const isPraise = post.type === 'praise';
        // Local state for optimistic UI updates
        const [hasPrayed, setHasPrayed] = useState(false);
        const [prayerCount, setPrayerCount] = useState(post.prayerCount || 0);
        const { user } = useAuth();

        // TODO: Load initial "prayed" state from UserStatsService or PostService
        // useEffect(() => { check if prayed... }, [])

        const handlePrayerClick = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasPrayed) return; // Prevent double clicks for now

            // Optimistic update
            setHasPrayed(true);
            setPrayerCount(prev => (prev || 0) + 1);

            if (user) {
                try {
                    // Track the prayer stat for the user
                    await UserStatsService.incrementStat(user.uid, 'prayersCount');
                    await UserStatsService.trackActivity(user.uid, 'prayer', { postId: post.id });

                    // Persist to local storage for simple "session" persistence if not fully backend wired
                    // In real implementation this goes to Firestore subcollection
                    localStorage.setItem(`prayed_${post.id}`, 'true');

                } catch (err) {
                    console.error('Failed to log prayer', err);
                }
            }
        };

        // Check local persistence for immediate feedback
        useEffect(() => {
            if (localStorage.getItem(`prayed_${post.id}`) === 'true') {
                setHasPrayed(true);
            }
        }, [post.id]);

        return (
            <div className={`w-full mb-8 rounded-[2rem] border border-white/10 p-6 bg-navy-900/30 backdrop-blur-sm transition-colors duration-300 animate-glowing-border ${isDetailView ? '' : 'snap-center'}`}>
                {/* Header: Author & Badge */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Avatar src={post.author.avatar} name={post.author.name} size="md" className="w-12 h-12" />
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight">@{post.author.name}</h3>
                            <span className="text-sm text-secondary">{post.createdAt ? '2h ago' : 'Just now'}</span>
                        </div>
                    </div>

                    <div className={`py-1.5 px-3 rounded-full font-bold tracking-widest text-[10px] uppercase shadow-inner ${isPraise
                        ? 'bg-green-900/20 text-green-400/90 border border-green-500/20'
                        : 'bg-gold-900/10 text-gold/80 border border-gold/20'
                        }`}>
                        {isPraise ? 'Praise' : 'Request'}
                    </div>
                </div>

                {/* Content - Clickable */}
                <div
                    onClick={() => !isDetailView && navigate(`/post/${post.id}`)}
                    className="mb-6 cursor-pointer group"
                >
                    <div className="text-xl text-cream-50 font-serif leading-relaxed tracking-wide">
                        <ClampedText text={post.content} isDetailView={isDetailView} onReadMore={handleReadMore} lines={7} />
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-white/5 mb-4" />

                {/* Bottom Actions */}
                <div className="flex items-center justify-between">
                    <span className="text-secondary font-medium text-base pl-1">{prayerCount} prayed</span>

                    <button
                        onClick={handlePrayerClick}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2 ${hasPrayed
                            ? (isPraise ? 'bg-green-600 text-white shadow-green-900/50' : 'bg-gold text-navy-950 shadow-gold/20')
                            : (isPraise ? 'bg-navy-800 text-green-400 border border-green-900/50 hover:bg-navy-700 animate-sacred-pulse' : 'bg-navy-800 text-gold border border-gold/30 hover:bg-navy-700 animate-sacred-pulse')
                            }`}
                    >
                        {hasPrayed ? (
                            <>
                                <CheckCircle2 size={18} className="animate-in zoom-in spin-in-180 duration-300" />
                                {isPraise ? 'Rejoiced' : 'Prayed'}
                            </>
                        ) : (
                            <>
                                {isPraise ? '🙌 I Rejoiced' : '🙏 I Prayed'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

// -- Subcomponents --

function ClampedText({ text, isDetailView, onReadMore, lines = 2 }: { text: string, isDetailView: boolean, onReadMore: (e: React.MouseEvent) => void, lines?: number }) {
    if (!text) return null;

    // Simple length check to avoid "Read more" on short text
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
                        className="text-gold font-medium hover:underline"
                    >
                        {part}
                    </Link>
                );
            }
            if (part.startsWith('@')) {
                const username = part.slice(1);
                // Assumption: username/handle checks are loose for now
                return (
                    <Link
                        key={i}
                        to={`/profile/${username}`} // Note: In real app, we need userId, not username. But for now this enables navigation.
                        onClick={(e) => e.stopPropagation()}
                        className="text-gold font-medium hover:underline"
                    >
                        {part}
                    </Link>
                );
            }
            return part;
        });
    };

    if (isDetailView || !isLong) {
        return <p className="text-sm font-light whitespace-pre-wrap">{renderContent(text)}</p>;
    }

    return (
        <div className="relative">
            <p className={`text-sm font-light line-clamp-${lines} whitespace-pre-wrap`}>
                {renderContent(text)}
            </p>
            <button onClick={onReadMore} className="text-xs font-bold text-gold mt-1 hover:underline">
                Read more
            </button>
        </div>
    );
}

function RightActionBar({ post, compact = false }: { post: Post, compact?: boolean }) {
    // check already done in parent
    return (
        <div className={`flex flex-col items-center gap-${compact ? 4 : 6} ${compact ? '' : 'absolute right-3 bottom-32 z-40'}`}>
            {!compact && (
                <div className="flex flex-col items-center gap-1">
                    <div className="p-0.5 border-2 border-white rounded-full bg-black/20 backdrop-blur-sm">
                        <Avatar src={post.author.avatar || ''} name={post.author.name} size="md" className="w-10 h-10 ring-0 shadow-none" />
                    </div>
                </div>
            )}

            <ActionButton icon={<Heart size={26} />} value={post.likes} />
            <ActionButton icon={<MessageCircle size={26} />} value={post.comments} />
            <ActionButton icon={<Bookmark size={26} />} />
            <ActionButton icon={<Share2 size={26} />} />
        </div>
    );
}

function ActionButton({ icon, value }: { icon: React.ReactNode, value?: number }) {
    return (
        <button className="flex flex-col items-center gap-1 group cursor-pointer z-40 relative">
            <div className="p-3 bg-black/40 backdrop-blur-md rounded-full group-active:scale-95 transition-transform text-white border border-white/20 shadow-lg hover:bg-black/60">
                {icon}
            </div>
            {value !== undefined && <span className="text-white text-xs font-bold drop-shadow-md">{value}</span>}
        </button>
    );
}

function SongBadge({ song }: { song: { title: string, artist: string } | undefined }) {
    if (!song) return null;
    return (
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 w-fit border border-white/10">
            <Music size={14} className="animate-spin-slow text-gold" />
            <div className="text-xs truncate max-w-[150px] text-cream-50">
                {song.title} • {song.artist}
            </div>
        </div>
    );
}

function VerseChip({ verse }: { verse: { ref: string, text: string } | undefined }) {
    if (!verse) return null;
    return (
        <div className="flex items-center gap-2 bg-gold/20 backdrop-blur-md border border-gold/40 rounded-lg px-3 py-2 mt-2 w-fit max-w-[85%]">
            <div className="w-1 h-8 bg-gold rounded-full shrink-0" />
            <div>
                <div className="text-xs font-bold text-gold-light">{verse.ref}</div>
                <div className="text-xs italic truncate text-cream-100">{verse.text}</div>
            </div>
        </div>
    );
}
