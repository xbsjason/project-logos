import { useState } from 'react';
import { Heart, Check } from 'lucide-react';
import type { PrayerRequest } from '../../data/mockData';

interface PrayerCardProps {
    prayer: PrayerRequest;
}

export function PrayerCard({ prayer }: PrayerCardProps) {
    const [prayed, setPrayed] = useState(false);
    const [count, setCount] = useState(prayer.prayerCount);

    const handlePray = () => {
        if (!prayed) {
            setPrayed(true);
            setCount(c => c + 1);
        }
    };

    return (
        <div className="bg-surface p-4 rounded-xl shadow-sm border border-default">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img
                        src={prayer.author.avatar}
                        alt={prayer.author.name}
                        className="w-10 h-10 rounded-full bg-surface-highlight object-cover"
                    />
                    <div>
                        <h3 className="font-bold text-primary">{prayer.author.name}</h3>
                        <span className="text-xs text-secondary">{prayer.timestamp}</span>
                    </div>
                </div>
                {prayer.category === 'Praise' && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                        Praise
                    </span>
                )}
            </div>

            <p className="text-primary leading-relaxed mb-4">
                {prayer.content}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-default">
                <span className="text-sm text-secondary font-medium">
                    {count} prayed
                </span>

                <button
                    onClick={handlePray}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all active:scale-95
            ${prayed
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                            : 'bg-surface-highlight text-primary hover:bg-surface-highlight/80'
                        }
          `}
                >
                    {prayed ? (
                        <>
                            <Check size={18} className="animate-in zoom-in spin-in-180 duration-300" />
                            <span>Prayed</span>
                        </>
                    ) : (
                        <>
                            <Heart size={18} />
                            <span>I Prayed</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
