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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-cream-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img
                        src={prayer.author.avatar}
                        alt={prayer.author.name}
                        className="w-10 h-10 rounded-full bg-cream-200"
                    />
                    <div>
                        <h3 className="font-bold text-navy">{prayer.author.name}</h3>
                        <span className="text-xs text-gray-500">{prayer.timestamp}</span>
                    </div>
                </div>
                {prayer.category === 'Praise' && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                        Praise
                    </span>
                )}
            </div>

            <p className="text-navy-light leading-relaxed mb-4">
                {prayer.content}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-cream-100">
                <span className="text-sm text-gray-500 font-medium">
                    {count} prayed
                </span>

                <button
                    onClick={handlePray}
                    disabled={prayed}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all
            ${prayed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-cream-100 text-navy hover:bg-gold hover:text-white'
                        }
          `}
                >
                    {prayed ? (
                        <>
                            <Check size={18} />
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
