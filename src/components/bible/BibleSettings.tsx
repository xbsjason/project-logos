import { Moon, Sun, Monitor, Type, Minus, Plus, X } from 'lucide-react';
import { useBibleSettings, type FontFamily } from '../../contexts/BibleContext';
import { useBibleProgress } from '../../contexts/BibleProgressContext';
import { useTheme } from '../../contexts/ThemeContext';

interface BibleSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BibleSettings({ isOpen, onClose }: BibleSettingsProps) {
    const { fontSize, setFontSize, fontFamily, setFontFamily } = useBibleSettings();
    const { theme, setTheme } = useTheme();
    const { resetProgress } = useBibleProgress();

    if (!isOpen) return null;

    const fonts: { name: string; value: FontFamily }[] = [
        { name: 'Merriweather', value: 'Merriweather' },
        { name: 'Crimson', value: 'Crimson Text' },
        { name: 'Inter', value: 'Inter' },
        { name: 'Public Sans', value: 'Public Sans' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl p-6 space-y-6 shadow-xl border border-default animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Type size={20} className="text-accent" />
                        Reader Settings
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-surface-highlight rounded-full transition-colors text-secondary">
                        <X size={20} />
                    </button>
                </div>

                {/* Theme Toggle */}
                <div className="bg-surface-highlight p-1 rounded-xl flex">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${theme === 'light' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                    >
                        <Sun size={18} />
                        Light
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${theme === 'dark' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                    >
                        <Moon size={18} />
                        Dark
                    </button>
                    <button
                        onClick={() => setTheme('system')}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${theme === 'system' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                    >
                        <Monitor size={18} />
                        Auto
                    </button>
                </div>

                {/* Preview */}
                <div
                    className="w-full bg-surface-highlight/30 rounded-xl p-4 border border-default min-h-[100px] flex items-center justify-center text-center transition-all duration-300"
                >
                    <p
                        className="text-primary transition-all duration-300 line-clamp-3"
                        style={{
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            lineHeight: '1.5'
                        }}
                    >
                        In the beginning was the Word, and the Word was with God, and the Word was God.
                    </p>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium text-secondary">
                        <span>Font Size</span>
                        <span>{fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-4 bg-surface-highlight/50 p-2 rounded-xl border border-default">
                        <button
                            onClick={() => setFontSize(fontSize - 2)}
                            className="p-2 hover:bg-surface rounded-lg transition-colors text-primary active:scale-95"
                            disabled={fontSize <= 12}
                        >
                            <Minus size={20} />
                        </button>
                        <input
                            type="range"
                            min="12"
                            max="32"
                            step="1"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="flex-1 accent-accent h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                        />
                        <button
                            onClick={() => setFontSize(fontSize + 2)}
                            className="p-2 hover:bg-surface rounded-lg transition-colors text-primary active:scale-95"
                            disabled={fontSize >= 32}
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Font Family */}
                <div className="space-y-3">
                    <span className="text-sm font-medium text-secondary">Font Family</span>
                    <div className="grid grid-cols-2 gap-3">
                        {fonts.map((font) => (
                            <button
                                key={font.value}
                                onClick={() => setFontFamily(font.value)}
                                className={`px-4 py-3 rounded-xl border text-left transition-all active:scale-95 ${fontFamily === font.value
                                    ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent'
                                    : 'border-default bg-surface hover:border-accent/50 text-primary'
                                    }`}
                            >
                                <span className={`block text-lg`} style={{ fontFamily: font.value }}>Aa</span>
                                <span className="text-xs opacity-75">{font.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Reset Progress */}
                <div className="pt-2 border-t border-default/50">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to reset your reading progress? This cannot be undone.')) {
                                resetProgress();
                                onClose();
                            }
                        }}
                        className="w-full py-3 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                    >
                        Reset Reading Progress
                    </button>
                </div>
            </div>
        </div>
    );
}
