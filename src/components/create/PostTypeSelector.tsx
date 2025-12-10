import { Music, Mic, Image, Type, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export type PostType = 'worship' | 'testimony' | 'verse_art' | 'prayer' | 'praise';

interface PostTypeSelectorProps {
    selectedType: PostType | null;
    onSelect: (type: PostType) => void;
}

export function PostTypeSelector({ selectedType, onSelect }: PostTypeSelectorProps) {
    const options: { type: PostType; label: string; icon: LucideIcon; color: string }[] = [
        { type: 'worship', label: 'Worship', icon: Music, color: 'bg-purple-100 text-purple-600' },
        { type: 'testimony', label: 'Testimony', icon: Video, color: 'bg-blue-100 text-blue-600' },
        { type: 'verse_art', label: 'Verse Art', icon: Image, color: 'bg-green-100 text-green-600' },
        { type: 'prayer', label: 'Prayer', icon: Mic, color: 'bg-orange-100 text-orange-600' },
        { type: 'praise', label: 'Praise', icon: Type, color: 'bg-yellow-100 text-yellow-600' },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 p-4">
            {options.map((option) => (
                <button
                    key={option.type}
                    onClick={() => onSelect(option.type)}
                    className={clsx(
                        "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
                        selectedType === option.type
                            ? "border-navy bg-navy/5 scale-95"
                            : "border-transparent bg-white shadow-sm hover:bg-gray-50"
                    )}
                >
                    <div className={clsx("p-3 rounded-full mb-3", option.color)}>
                        <option.icon size={24} />
                    </div>
                    <span className="font-semibold text-navy">{option.label}</span>
                </button>
            ))}
        </div>
    );
}
