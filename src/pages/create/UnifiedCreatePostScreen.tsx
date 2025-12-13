import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Camera, Music, BookOpen, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TrackPickerSheet } from '../../components/create/TrackPickerSheet';
import { type AudioTrack } from '../../data/mockAudio';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../services/firebase';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type PostType = 'prayer' | 'praise' | 'verse_art' | 'worship' | 'testimony';

export function UnifiedCreatePostScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // -- State --
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<PostType | null>(null); // Null means auto-infer
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
    const [verseData, setVerseData] = useState<{ ref: string; text: string; id?: string } | null>(null);

    // UI State
    const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoFit, setVideoFit] = useState<'cover' | 'contain'>('cover');

    // -- Initialization --
    useEffect(() => {
        const initialRef = searchParams.get('verseRef');
        const initialText = searchParams.get('verseText');
        const initialId = searchParams.get('verseId');

        if (initialRef && initialText) {
            setVerseData({ ref: initialRef, text: initialText, id: initialId || undefined });
        }
    }, [searchParams]);

    // -- Auto-Inference Logic represents `inferPostType()` --
    const inferredType: PostType = (() => {
        if (postType) return postType; // Manual override

        // 1. Tags / Keywords (Simple check) - Skipped for now

        // 2. Attachments
        if (mediaFile?.type.startsWith('video/')) return 'worship'; // Or testimony
        if (mediaFile?.type.startsWith('image/') && verseData) return 'verse_art';
        if (verseData && !mediaFile) return 'testimony'; // Reflection

        // 3. Default text-only
        return 'testimony';
    })();

    // -- Handlers --

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setMediaFile(e.target.files[0]);
        }
    };

    // -- Extract Entities --
    const extractEntities = (text: string) => {
        const uniqueTags = new Set(
            (text.match(/#[a-z0-9_]+/gi) || []).map(tag => tag.slice(1).toLowerCase())
        );
        const uniqueMentions = new Set(
            (text.match(/@[a-z0-9_]+/gi) || []).map(mention => mention.slice(1))
        );
        return {
            tags: Array.from(uniqueTags),
            mentions: Array.from(uniqueMentions)
        };
    };

    const handlePost = async () => {
        if (!user) return;
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Generate ID locally
            const postsCollection = collection(db, 'posts');
            const newPostRef = doc(postsCollection);
            const postId = newPostRef.id;

            // 2. Upload Media
            let mediaUrl = null;
            let thumbnailUrl = null;
            const isVideo = mediaFile?.type.startsWith('video/');

            if (mediaFile) {
                // Path: /posts/{userId}/{postId}/original
                const path = `posts/${user.uid}/${postId}/original`;
                const storageRef = ref(storage, path);

                await uploadBytes(storageRef, mediaFile);
                mediaUrl = await getDownloadURL(storageRef);

                // Thumbnail gen skipped for MVP
            }

            // 3. Write Firestore Document
            const finalType = inferredType;
            const { tags, mentions } = extractEntities(content);

            await setDoc(newPostRef, {
                id: postId, // Ensure ID is in document
                authorId: user.uid,
                author: { // Denormalized author info for easy display
                    name: user.displayName || 'Anonymous',
                    avatar: user.photoURL || null,
                    username: user.username || user.uid // Fallback
                },
                type: finalType,
                content: mediaUrl || content, // If media, content is URL. If text, content is text.
                caption: mediaUrl ? content : '', // If media, caption is text. If text, caption is empty/redundant. 
                // Note: The previous logic in seed logic used 'content' for text if type=text.
                // Let's normalize: 
                // - type=text/prayer => content = text, caption = ''
                // - type=image/video => content = url, caption = text

                tags,
                mentions,
                visibility: 'public',

                // Media
                mediaUrl, // keeping this for explicit reference if needed
                thumbnailUrl,
                isVideo: !!isVideo,

                // Audio
                song: selectedTrack ? {
                    title: selectedTrack.title,
                    artist: selectedTrack.artist
                } : null,

                // Verse
                verse: verseData ? {
                    ref: verseData.ref,
                    text: verseData.text,
                    id: verseData.id
                } : null,

                // Metrics
                likes: 0,
                comments: 0,
                shares: 0,
                prayerCount: 0,
                prayedBy: {},
                createdAt: serverTimestamp()
            });

            navigate('/');

        } catch (err) {
            console.error('Post creation failed:', err);
            setError('Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canPost = (content.length > 0 || !!mediaFile || !!verseData) && !isSubmitting;

    // -- Render --
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-navy hover:bg-gray-50 rounded-full transition-colors"
                    disabled={isSubmitting}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-navy">Create</h1>
                <button
                    onClick={handlePost}
                    disabled={!canPost}
                    className="font-bold text-gold-600 disabled:opacity-40 disabled:cursor-not-allowed hover:text-gold-700 transition-colors"
                >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Post'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">

                    {/* Text Input */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your heart?"
                        className="w-full min-h-[120px] text-lg text-navy placeholder:text-gray-400 resize-none outline-none font-sans"
                        autoFocus
                    />

                    {/* Attachments Preview */}
                    <div className="space-y-3">
                        {/* Media Preview */}
                        {mediaFile && (
                            <div
                                className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group transition-all duration-300 ease-out"
                                style={{
                                    // Height rule: min(60vh, screenWidth * 1.25) -> approx 125% width
                                    // We use max-height to ensure it doesn't take over entire screen on desktop
                                    maxHeight: '60vh',
                                    aspectRatio: 'unset' // Let content determine or dynamic
                                }}
                            >
                                <button
                                    onClick={() => setMediaFile(null)}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full z-10 hover:bg-black/70 active:scale-95 transition-all"
                                >
                                    <X size={16} />
                                </button>

                                {mediaFile.type.startsWith('image/') ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-white text-[10px] font-medium z-10 flex items-center gap-1">
                                            <ImageIcon size={12} />
                                            <span>Image</span>
                                        </div>
                                        <img
                                            src={URL.createObjectURL(mediaFile)}
                                            alt="Preview"
                                            className="w-full h-auto max-h-[60vh] object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full flex items-center justify-center bg-black min-h-[300px]">
                                        {/* Video Controls Overlay */}
                                        <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
                                            {/* Fit/Fill Toggle */}
                                            <div className="flex bg-black/50 backdrop-blur-md rounded-lg p-0.5 border border-white/10">
                                                <button
                                                    onClick={() => setVideoFit('contain')}
                                                    className={clsx(
                                                        "px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                                                        videoFit === 'contain' ? "bg-white text-black" : "text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    Fit
                                                </button>
                                                <button
                                                    onClick={() => setVideoFit('cover')}
                                                    className={clsx(
                                                        "px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                                                        videoFit === 'cover' ? "bg-white text-black" : "text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    Fill
                                                </button>
                                            </div>
                                        </div>

                                        <video
                                            src={URL.createObjectURL(mediaFile)}
                                            className={clsx(
                                                "w-full h-full max-h-[60vh]",
                                                videoFit === 'cover' ? "object-cover" : "object-contain"
                                            )}
                                            controls
                                            playsInline
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Verse Preview */}
                        {verseData && (
                            <div className="bg-cream-100 rounded-xl p-4 relative border border-gold-200/50">
                                <button
                                    onClick={() => setVerseData(null)}
                                    className="absolute top-2 right-2 text-navy/40 hover:text-navy p-1"
                                >
                                    <X size={14} />
                                </button>
                                <div className="flex items-start gap-3">
                                    <BookOpen size={20} className="text-gold-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-navy text-sm font-serif">{verseData.ref}</h4>
                                        <p className="text-navy/70 text-sm font-serif italic line-clamp-2">"{verseData.text}"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Music Preview */}
                        {selectedTrack && (
                            <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-100">
                                <div className="p-1 bg-purple-200 rounded-full">
                                    <Music size={12} />
                                </div>
                                <span className="max-w-[150px] truncate">{selectedTrack.title}</span>
                                <button
                                    onClick={() => setSelectedTrack(null)}
                                    className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Actions Area */}
            <div className="bg-white border-t border-gray-50 pb-safe"> {/* pb-safe for iPhone bottom area */}

                {/* 1. Post Type Selector (Secondary) */}
                <div className="px-4 py-3 overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                        Type:
                    </span>
                    {(['prayer', 'praise', 'verse_art', 'worship', 'testimony'] as PostType[]).map(type => {
                        const isActive = inferredType === type;
                        const isManual = postType === type;

                        return (
                            <button
                                key={type}
                                onClick={() => setPostType(isActive && isManual ? null : type)} // Toggle off if manual, else set
                                className={clsx(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap capitalize",
                                    isActive
                                        ? "bg-navy text-white shadow-sm"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                )}
                            >
                                {type.replace('_', ' ')}
                            </button>
                        );
                    })}
                </div>

                {/* 2. Attachment Toolbar */}
                <div className="p-2 flex items-center justify-around gap-2">

                    {/* Media */}
                    <label className="flex-1 flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors text-gray-600 active:scale-95">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <ImageIcon size={24} className="text-green-600" />
                        <span className="text-[10px] font-medium">Media</span>
                    </label>

                    {/* Camera (Mock) */}
                    <button
                        onClick={() => alert("Camera recording not implemented in this demo.")}
                        className="flex-1 flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors text-gray-600 active:scale-95"
                    >
                        <Camera size={24} className="text-blue-500" />
                        <span className="text-[10px] font-medium">Camera</span>
                    </button>

                    {/* Music */}
                    <button
                        onClick={() => setIsMusicPickerOpen(true)}
                        className={clsx(
                            "flex-1 flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors text-gray-600 active:scale-95",
                            selectedTrack && "text-purple-600"
                        )}
                    >
                        <Music size={24} className="text-purple-500" />
                        <span className="text-[10px] font-medium">Music</span>
                    </button>

                    {/* Verse */}
                    <button
                        onClick={() => {
                            // Simple prompt for MVP as requested ("Verse picker integration")
                            const ref = prompt("Enter Verse Reference (e.g. John 3:16):");
                            if (ref) {
                                const text = prompt("Enter Verse Text:");
                                if (text) setVerseData({ ref, text });
                            }
                        }}
                        className={clsx(
                            "flex-1 flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors text-gray-600 active:scale-95",
                            verseData && "text-gold-600"
                        )}
                    >
                        <BookOpen size={24} className="text-gold-500" />
                        <span className="text-[10px] font-medium">Verse</span>
                    </button>

                </div>
            </div>

            {/* Sheets */}
            <TrackPickerSheet
                isOpen={isMusicPickerOpen}
                onClose={() => setIsMusicPickerOpen(false)}
                onSelect={(track) => {
                    setSelectedTrack(track);
                    setIsMusicPickerOpen(false);
                }}
                selectedTrackId={selectedTrack?.id}
            />

        </div>
    );
}
