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
import { VerseArtEditor } from '../../components/verse-art/VerseArtEditor';
import { VersePicker } from '../../components/verse-art/VersePicker';
import { useBibleSettings } from '../../contexts/BibleContext';

type PostType = 'prayer' | 'praise' | 'verse_art' | 'worship' | 'testimony';

export function UnifiedCreatePostScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { version } = useBibleSettings();

    // -- State --
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<PostType | null>(null); // Null means auto-infer
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
    const [verseData, setVerseData] = useState<{ ref: string; text: string; id?: string } | null>(null);

    // UI State
    const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
    const [showVersePicker, setShowVersePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoFit, setVideoFit] = useState<'cover' | 'contain'>('cover');

    // -- Initialization --
    useEffect(() => {
        const initialRef = searchParams.get('verseRef') || searchParams.get('ref');
        const initialText = searchParams.get('verseText') || searchParams.get('text');
        const initialId = searchParams.get('verseId') || searchParams.get('id');
        const initialType = searchParams.get('type') as PostType | null;

        if (initialRef && initialText) {
            setVerseData({
                ref: initialRef,
                text: initialText,
                id: initialId || undefined
            });
        }
        if (initialType) {
            setPostType(initialType);
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

    // -- Verse Art Logic --
    useEffect(() => {
        if (postType === 'verse_art' && !verseData) {
            setShowVersePicker(true);
        }
    }, [postType, verseData]);

    const handleVerseSelect = (ref: string, text: string, bookId: string, chapter: number, verse: number) => {
        setVerseData({ ref, text, id: `${bookId}:${chapter}:${verse}` });
        setShowVersePicker(false);
    };

    const handleVerseArtPost = async (blob: Blob, caption: string) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const postsCollection = collection(db, 'posts');
            const newPostRef = doc(postsCollection);
            const postId = newPostRef.id;

            // Upload Blob
            const path = `posts/${user.uid}/${postId}/verse_art.png`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, blob);
            const mediaUrl = await getDownloadURL(storageRef);

            await setDoc(newPostRef, {
                id: postId,
                authorId: user.uid,
                author: {
                    name: user.displayName || 'Anonymous',
                    avatar: user.photoURL || null,
                    username: user.username || user.uid
                },
                type: 'verse_art',
                content: mediaUrl,
                caption: caption,
                tags: [],
                mentions: [],
                visibility: 'public',
                mediaUrl,
                thumbnailUrl: null,
                isVideo: false,
                verse: verseData ? { ref: verseData.ref, text: verseData.text, id: verseData.id } : null,
                likes: 0, comments: 0, shares: 0, prayerCount: 0, prayedBy: {},
                createdAt: serverTimestamp()
            });

            navigate('/');
        } catch (error) {
            console.error('Verse Art Post failed:', error);
            setError('Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    // -- Render Overlays --
    // We render VersePicker as a true overlay to keep underlying state (like Canvas) alive
    const renderPicker = () => {
        if (!showVersePicker) return null;
        return (
            <VersePicker
                version={version}
                onSelect={handleVerseSelect}
                onClose={() => {
                    setShowVersePicker(false);
                    // If we were auto-forcing verse art but didn't pick one, cancel mode
                    if (postType === 'verse_art' && !verseData) {
                        setPostType(null);
                    }
                }}
            />
        );
    };

    // If in Verse Art Mode, show Editor
    if (postType === 'verse_art' && verseData) {
        return (
            <>
                <VerseArtEditor
                    verseRef={verseData.ref}
                    verseText={verseData.text}
                    version={version.toUpperCase()}
                    onBack={() => setPostType(null)}
                    onPost={handleVerseArtPost}
                    onChangeVerse={() => setShowVersePicker(true)}
                />
                {renderPicker()}
            </>
        );
    }

    // -- Main Render --
    return (
        <div className="h-full bg-white flex flex-col relative overflow-hidden">
            {renderPicker()} {/* Render on top if active */}

            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-50 bg-white shrink-0 z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-navy hover:bg-gray-50 rounded-full transition-colors"
                    disabled={isSubmitting}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-navy">New Post</h1>
                <button
                    onClick={handlePost}
                    disabled={!canPost}
                    className="font-bold text-gold-600 disabled:opacity-40 disabled:cursor-not-allowed hover:text-gold-700 transition-colors"
                >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Share'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
                <div className="flex flex-col">

                    {/* 1. Media Area (Instagram Style: Media First) */}
                    {/* Only show if media exists, otherwise Text Input is primary */}

                    {mediaFile && (
                        <div className="w-full bg-gray-50 relative group">
                            <button
                                onClick={() => setMediaFile(null)}
                                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full z-20 hover:bg-black/70 transition-all backdrop-blur-md"
                            >
                                <X size={16} />
                            </button>

                            {mediaFile.type.startsWith('image/') ? (
                                <div className="w-full flex items-center justify-center bg-gray-100 min-h-[300px]">
                                    <img
                                        src={URL.createObjectURL(mediaFile)}
                                        alt="Preview"
                                        className="w-full h-auto max-h-[60vh] object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="relative w-full flex items-center justify-center bg-black min-h-[300px]">
                                    {/* Video Controls Overlay */}
                                    <button
                                        onClick={() => setVideoFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                                        className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-full z-20 hover:bg-white/20 transition-all border border-white/20"
                                    >
                                        {/* Simple Aspect Ratio Icon logic */}
                                        {videoFit === 'cover' ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-4 h-2.5 border-2 border-white rounded-[2px]" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-white rounded-[2px]" />
                                            </div>
                                        )}
                                    </button>

                                    <video
                                        src={URL.createObjectURL(mediaFile)}
                                        className={clsx(
                                            "w-full max-h-[60vh]",
                                            videoFit === 'cover' ? "object-cover h-[400px]" : "object-contain h-auto"
                                        )}
                                        controls
                                        playsInline
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. Text Content */}
                    <div className="p-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-navy text-white font-bold text-sm">
                                        {user?.displayName?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write a caption..."
                                className="flex-1 min-h-[100px] text-base text-navy placeholder:text-gray-400 resize-none outline-none font-sans bg-transparent py-2"
                                autoFocus={!mediaFile}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 mx-4" />

                    {/* 3. Other Previews (Verse / Music) */}
                    <div className="p-4 space-y-3">
                        {/* Verse Preview */}
                        {verseData && (
                            <div className="bg-cream-50 rounded-xl p-4 relative border border-gold-100 flex items-start gap-4">
                                <button
                                    onClick={() => setVerseData(null)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-navy p-1"
                                >
                                    <X size={16} />
                                </button>
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-cream-100 text-gold-600">
                                    <BookOpen size={20} />
                                </div>
                                <div className="flex-1 pr-6">
                                    <h4 className="font-bold text-navy text-sm font-serif mb-1">{verseData.ref}</h4>
                                    <p className="text-navy/70 text-sm font-serif italic line-clamp-2">"{verseData.text}"</p>
                                </div>
                            </div>
                        )}

                        {/* Music Preview */}
                        {selectedTrack && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 relative">
                                <button
                                    onClick={() => setSelectedTrack(null)}
                                    className="absolute top-1/2 -translate-y-1/2 right-3 text-purple-400 hover:text-purple-700"
                                >
                                    <X size={16} />
                                </button>
                                <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                                    <Music size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-navy">{selectedTrack.title}</div>
                                    <div className="text-xs text-purple-600">{selectedTrack.artist}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Actions Area */}
            <div className="bg-white border-t border-gray-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-50">

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
                        onClick={() => setShowVersePicker(true)}
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
