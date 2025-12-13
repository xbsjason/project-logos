import { MOCK_PRAYERS } from '../../data/mockData';
import { PrayerCard } from '../../components/prayer/PrayerCard';
import { Plus } from 'lucide-react';

export function PrayerPage() {
    return (
        <div className="pb-20 bg-background min-h-full transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface border-b border-default px-4 h-16 flex items-center justify-between shadow-sm transition-colors duration-300">
                <h1 className="text-xl font-serif font-bold text-primary">Prayer Wall</h1>
                <button className="p-2 bg-primary text-inverse rounded-full shadow-lg transition-colors hover:bg-text-secondary">
                    <Plus size={20} />
                </button>
            </div>

            {/* Feed */}
            <div className="p-4 space-y-4">
                {MOCK_PRAYERS.map((prayer) => (
                    <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
            </div>
        </div>
    );
}
