import { useState } from 'react';
import { ArrowLeft, ChevronRight, Upload, X, Music, Type } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PostTypeSelector } from '../../components/create/PostTypeSelector';
import type { PostType } from '../../components/create/PostTypeSelector';

export function CreatePostPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Derived state from URL
    const initialType = searchParams.get('type') as PostType | null;
    const initialRef = searchParams.get('verseRef');
    const initialText = searchParams.get('verseText');
    const isVerseArt = initialType === 'verse_art' && initialRef && initialText;

    // State
    const [step, setStep] = useState(isVerseArt ? 2 : 1);
    const [postType, setPostType] = useState<PostType | null>(initialType);
    const [caption, setCaption] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [verseData] = useState<{ ref: string, text: string } | null>(
        isVerseArt ? { ref: initialRef, text: initialText } : null
    );

    const handleNext = () => {
        if (step === 1 && postType) setStep(2);
        else if (step === 2) setStep(3);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else navigate(-1);
    };

    const handleSubmit = () => {
        // Mock submission
        console.log('Submitting post:', { postType, caption, mediaFile, verseData });
        navigate('/');
    };

    const renderMediaStep = () => {
        if (postType === 'verse_art' && verseData) {
            return (
                <div className="p-4 max-w-md mx-auto">
                    <div className="aspect-[4/5] bg-gradient-to-br from-navy to-purple-900 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-xl relative overflow-hidden group">
                        {/* Mock customization controls */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 bg-white/20 rounded-full text-white backdrop-blur-md">
                                <Type size={20} />
                            </button>
                        </div>

                        <h3 className="text-gold font-bold text-xl mb-4 font-serif">{verseData.ref}</h3>
                        <p className="text-white text-lg font-serif italic leading-relaxed">
                            "{verseData.text}"
                        </p>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/20 backdrop-blur-sm text-white/60 text-xs">
                            FaithVoice Verse Art
                        </div>
                    </div>
                    <p className="text-center text-sm text-gray-400 mt-4">
                        Tap "Next" to add a caption.
                    </p>
                </div>
            );
        }

        // Default Media Uploader
        return (
            <div className="p-4 max-w-md mx-auto w-full h-full flex flex-col justify-center">
                <div className="w-full max-h-[60vh] aspect-[9/16] mx-auto bg-cream-100/50 rounded-2xl border-2 border-dashed border-navy/20 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-cream-100 transition-colors">
                    {mediaFile ? (
                        <>
                            <div className="absolute top-2 right-2 z-10">
                                <button
                                    onClick={() => setMediaFile(null)}
                                    className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            {mediaFile.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(mediaFile)}
                                    alt="Preview"
                                    className="w-full h-full object-contain bg-black/5"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <p className="font-bold text-navy">{mediaFile.name}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <label className="flex flex-col items-center gap-4 cursor-pointer p-8 w-full h-full justify-center hover:scale-[1.02] transition-transform duration-200">
                            <div className="p-5 bg-white rounded-full shadow-md text-navy group-hover:text-gold transition-colors">
                                <Upload size={32} />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-bold text-navy text-lg">Upload Media</p>
                                <p className="text-sm text-gray-500">Photos or Video up to 60s</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-cream-50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-cream-200 px-4 h-14 flex items-center justify-between shadow-sm">
                <button onClick={handleBack} className="p-2 -ml-2 text-navy">
                    <ArrowLeft size={24} />
                </button>
                <span className="font-bold text-navy">New Post (Step {step}/3)</span>
                <button
                    onClick={handleNext}
                    disabled={step === 1 && !postType}
                    className="text-gold-dark font-semibold disabled:opacity-50"
                >
                    {step === 3 ? 'Post' : 'Next'}
                </button>
            </div>

            {/* Step 1: Type Selection */}
            {step === 1 && (
                <div className="max-w-md mx-auto">
                    <div className="p-6 text-center">
                        <h2 className="text-xl font-bold text-navy">What do you want to share?</h2>
                        <p className="text-gray-500 mt-2">Choose a format for your post</p>
                    </div>
                    <PostTypeSelector selectedType={postType} onSelect={setPostType} />
                </div>
            )}

            {/* Step 2: Media (or Verse Art Canvas) */}
            {step === 2 && renderMediaStep()}

            {/* Step 3: Details */}
            {step === 3 && (
                <div className="p-4 max-w-md mx-auto space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200">
                        <textarea
                            className="w-full h-32 resize-none outline-none text-navy placeholder:text-gray-400 font-sans text-lg"
                            placeholder="Write a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-cream-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Music size={20} />
                                </div>
                                <span className="font-medium text-navy">Add Worship Song</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>

                        <button
                            onClick={handleSubmit}
                            className="w-full py-4 bg-gold text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-transform mt-8"
                        >
                            Share Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
