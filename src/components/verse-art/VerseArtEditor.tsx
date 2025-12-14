import { useRef, useEffect, useState } from 'react';
import { Check, RefreshCw, Type, X, Loader2 } from 'lucide-react';
import { verseArtService } from '../../services/VerseArtService';

interface VerseArtEditorProps {
    verseRef: string;
    verseText: string;
    version?: string;
    onBack: () => void;
    onPost: (blob: Blob, caption: string) => void;
    onChangeVerse: () => void; // Call to open Verse Picker
}

const GRADIENTS = [
    { name: 'Sunrise', type: 'linear', colors: ['#f6d365', '#fda085'], displayColor: '#fda085' },
    { name: 'Ocean', type: 'linear', colors: ['#2E3192', '#1BFFFF'], displayColor: '#2E3192' },
    { name: 'Forest', type: 'linear', colors: ['#11998e', '#38ef7d'], displayColor: '#11998e' },
    { name: 'Purple Love', type: 'linear', colors: ['#cc2b5e', '#753a88'], displayColor: '#753a88' },
    { name: 'Midnight', type: 'radial', colors: ['#232526', '#414345'], displayColor: '#232526' },
    { name: 'Sunset', type: 'linear', colors: ['#ff9966', '#ff5e62'], displayColor: '#ff5e62' },
    { name: 'Royal', type: 'linear', colors: ['#141E30', '#243B55'], displayColor: '#141E30' },
    { name: 'Clean', type: 'linear', colors: ['#ffffff', '#f5f5f5'], displayColor: '#dddddd', defaultText: '#000000' }
];

export function VerseArtEditor({ verseRef, verseText, version = "NIV", onBack, onPost, onChangeVerse }: VerseArtEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
    const [textColor, setTextColor] = useState('#ffffff');
    const [caption, setCaption] = useState('');
    const [isRendering, setIsRendering] = useState(false);

    // Determine optimized text color when gradient changes if user hasn't manually overridden (simplified logic: just set default based on gradient brightness or simplistic map)
    useEffect(() => {
        // Auto-switch to black for light backgrounds (like 'Clean')
        if ((selectedGradient as any).defaultText) {
            setTextColor((selectedGradient as any).defaultText);
        } else {
            // Default to white for most colorful gradients
            setTextColor('#ffffff');
        }
    }, [selectedGradient]);

    // Init Canvas
    useEffect(() => {
        if (canvasRef.current) {
            verseArtService.initCanvas(canvasRef.current);
        }
        return () => {
            // Cleanup? verseArtService is shared, so maybe just don't destroy checking logic
            // verseArtService.destroy(); // We might want to keep worker alive? 
            // Ideally we destroy on unmount if we want to release offscreen
        };
    }, []);

    // Trigger Render
    useEffect(() => {
        if (!canvasRef.current) return;

        // Debounce or just render? 
        // For local worker msg, it's fast enough.

        const config: RenderConfig = {
            width: 1080, // High res internal
            height: 1350, // 4:5
            text: verseText,
            reference: verseRef,
            version: version,
            gradientColors: selectedGradient.colors,
            gradientType: selectedGradient.type as 'linear' | 'radial',
            textColor: textColor
        };

        verseArtService.render(config);

    }, [verseText, verseRef, version, selectedGradient, textColor]);

    const handlePostClick = async () => {
        try {
            setIsRendering(true);
            const blob = await verseArtService.exportImage('image/png');
            onPost(blob, caption);
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to create image. Please try again.");
        } finally {
            setIsRendering(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-cream-50 fixed inset-0 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-cream-200 shadow-sm shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 text-navy hover:bg-cream-100 rounded-full transition-colors">
                    <X size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-navy text-lg leading-tight">Create Art</span>
                </div>
                <button
                    onClick={handlePostClick}
                    disabled={isRendering}
                    className="text-gold-dark font-bold text-lg disabled:opacity-50"
                >
                    {isRendering ? <Loader2 className="animate-spin" size={24} /> : 'Next'}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-6">

                {/* Canvas Preview */}
                {/* We scale the canvas down with CSS to fit screen, but keep internal res high */}
                <div className="relative w-full max-w-sm aspect-[4/5] shadow-2xl rounded-2xl overflow-hidden bg-gray-100 ring-4 ring-white">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-contain"
                        style={{ width: '100%', height: '100%' }}
                    />

                    {/* Floating Verse Change Button - "Crucial" requirement */}
                    <button
                        onClick={onChangeVerse}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                        <RefreshCw size={12} />
                        Change Verse
                    </button>
                </div>

                {/* Controls Area */}
                <div className="w-full max-w-md space-y-6 pb-20">

                    {/* Filter / Gradient Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Theme</label>
                        <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x">
                            {GRADIENTS.map((g) => (
                                <button
                                    key={g.name}
                                    onClick={() => setSelectedGradient(g)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-xl shadow-sm border-2 transition-all snap-start ${selectedGradient.name === g.name
                                        ? 'border-gold scale-105 ring-2 ring-gold/20'
                                        : 'border-white hover:border-gray-300'
                                        }`}
                                    style={{ background: g.displayColor }} // Or linear gradient preview
                                >
                                    {selectedGradient.name === g.name && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                                            <Check size={20} className="text-white drop-shadow-md" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Settings */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-cream-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-cream-100 text-navy rounded-lg">
                                <Type size={20} />
                            </span>
                            <span className="font-semibold text-navy">Text Color</span>
                        </div>
                        <div className="flex bg-cream-100 p-1 rounded-lg">
                            <button
                                onClick={() => setTextColor('#ffffff')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${textColor === '#ffffff'
                                    ? 'bg-white text-navy shadow-sm'
                                    : 'text-gray-500 hover:text-navy'
                                    }`}
                            >
                                White
                            </button>
                            <button
                                onClick={() => setTextColor('#000000')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${textColor === '#000000'
                                    ? 'bg-white text-navy shadow-sm'
                                    : 'text-gray-500 hover:text-navy'
                                    }`}
                            >
                                Black
                            </button>
                        </div>
                    </div>

                    {/* Caption Input (Moved to next screen typically for standard posts, but requirement says "A small, optional text box for the user to add a caption" in Editor?)
                       Spec says "Caption Input: A small, optional text box". 
                       However, the "Next" button usually leads to a final review page. 
                       If we follow the VAE spec: "Tapping Post uploads the image/data... user is returned to [screen]".
                       So the storage/upload happens HERE.
                       This means this is the FINAL screen.
                    */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Caption (Optional)</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write something inspired..."
                            className="w-full bg-white border border-cream-200 rounded-xl p-3 text-navy placeholder:text-gray-400 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 resize-none h-24"
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}
