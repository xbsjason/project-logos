import { useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Music, Bookmark } from 'lucide-react';
import type { Post } from '../../data/mockData';

interface FeedPostProps {
    post: Post;
    isActive: boolean;
}

export function FeedPost({ post, isActive }: FeedPostProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay policy might block unmuted playback
                console.log('Autoplay blocked');
            });
        } else if (!isActive && videoRef.current) {
            videoRef.current.pause();
        }
    }, [isActive]);

    return (
        <div className="relative w-full h-full bg-navy-dark snap-start shrink-0 overflow-hidden">
            {/* Background Media */}
            <div className="absolute inset-0 bg-black">
                {post.type === 'video' && (
                    <video
                        ref={videoRef}
                        src={post.content}
                        className="w-full h-full object-cover opacity-90"
                        loop
                        muted
                        playsInline
                    />
                )}
                {post.type === 'image' && (
                    <img
                        src={post.content}
                        alt={post.caption}
                        className="w-full h-full object-cover opacity-90"
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
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
            </div>

            {/* Right Action Bar */}
            <div className="absolute right-2 bottom-20 flex flex-col items-center gap-6 z-20">
                <div className="flex flex-col items-center gap-1">
                    <div className="p-2 border-2 border-white rounded-full p-0.5">
                        <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full bg-navy"
                        />
                    </div>
                </div>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full group-active:scale-95 transition-transform">
                        <Heart size={28} className="text-white fill-transparent group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-white text-xs font-medium drop-shadow-md">{post.likes}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full">
                        <MessageCircle size={28} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-medium drop-shadow-md">{post.comments}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full">
                        <Bookmark size={28} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-medium drop-shadow-md">Save</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full">
                        <Share2 size={28} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
                </button>
            </div>

            {/* Bottom Info Area */}
            <div className="absolute bottom-4 left-4 right-16 z-20 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-shadow-sm">@{post.author.name}</h3>
                    <span className="text-xs bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">Follow</span>
                </div>

                <p className="text-sm font-light mb-3 line-clamp-2 drop-shadow-md">
                    {post.caption}
                </p>

                {/* Attachments (Song or Verse) */}
                {post.song && (
                    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 w-fit">
                        <Music size={14} className="animate-spin-slow" />
                        <div className="text-xs truncate max-w-[150px]">
                            {post.song.title} • {post.song.artist}
                        </div>
                    </div>
                )}

                {post.verse && (
                    <div className="flex items-center gap-2 bg-gold/20 backdrop-blur-md border border-gold/40 rounded-lg px-3 py-2 mt-2 w-fit max-w-[85%]">
                        <div className="w-1 h-8 bg-gold rounded-full shrink-0" />
                        <div>
                            <div className="text-xs font-bold text-gold-light">{post.verse.ref}</div>
                            <div className="text-xs italic truncate text-cream-100">{post.verse.text}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
