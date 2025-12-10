import { MOCK_PRAYERS } from '../../data/mockData';
import { PrayerCard } from '../../components/prayer/PrayerCard';
import { Plus } from 'lucide-react';

export function PrayerPage() {
    return (
        <div className="pb-20 bg-cream-50 min-h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-cream-200 px-4 h-16 flex items-center justify-between shadow-sm">
                <h1 className="text-xl font-serif font-bold text-navy">Prayer Wall</h1>
                <button className="p-2 bg-navy text-white rounded-full shadow-lg">
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
