import { useState } from 'react';
import { AVAILABLE_VERSIONS, useBibleSettings } from '../../contexts/BibleContext';

interface VersionSelectorProps {
    className?: string;
    variant?: 'minimal' | 'full' | 'text';
}

export function VersionSelector({ className = '', variant = 'minimal' }: VersionSelectorProps) {
    const { version, setVersion } = useBibleSettings();
    const [isOpen, setIsOpen] = useState(false);

    // Determines button style based on variant
    const getButtonStyles = () => {
        switch (variant) {
            case 'full':
                return 'text-sm font-medium text-primary bg-surface/50 px-3 py-1.5 rounded-full hover:bg-surface-highlight border border-transparent hover:border-gold/20';
            case 'text':
                // Mobile-friendly: Larger touch target, always visible indicator
                return 'text-sm text-secondary font-medium hover:text-primary py-1 bg-transparent flex items-center gap-1.5 transition-colors';
            case 'minimal':
            default:
                return 'text-xs text-secondary font-sans hover:text-primary';
        }
    };

    return (
        <div className={`relative inline-block z-50 ${className}`}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-1 transition-colors focus:outline-none ${getButtonStyles()}`}
            >
                <span>{AVAILABLE_VERSIONS.find(v => v.id === version)?.name || version}</span>
                {variant === 'text' ? (
                    <span className={`text-[10px] text-gold transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                ) : (
                    <span className="opacity-50 text-[10px]">▼</span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    />
                    <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-default rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                        <div className="p-1 max-h-60 overflow-y-auto">
                            {AVAILABLE_VERSIONS.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setVersion(v.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${version === v.id
                                        ? 'bg-gold/10 text-gold font-bold'
                                        : 'text-primary hover:bg-surface-highlight'
                                        }`}
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
