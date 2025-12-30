import { type MomentCategory } from '../types/Moment';

export const MOMENT_CATEGORY_META: Record<MomentCategory, { label: string; color: string; icon?: string }> = {
    peace: { label: 'Peace & Stillness', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-100' },
    prayer: { label: 'Prayer', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-100' },
    gratitude: { label: 'Gratitude', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-100' },
    rest: { label: 'Night & Rest', color: 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100' },
    strength: { label: 'Strength & Trust', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-100' },
    bible: { label: 'Bible Reading', color: 'bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100' },
    hope: { label: 'Hope', color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-100' },
    wisdom: { label: 'Wisdom', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-100' },
};

export const MOMENT_CARD_THEMES = [
    'bg-[#FDF6E3] text-[#5D5c4D]', // Soft cream / earthy
    'bg-[#E6E6FA] text-[#483D8B]', // Lavender
    'bg-[#E0F7FA] text-[#006064]', // Cyan mist
    'bg-[#FFF3E0] text-[#E65100]', // Soft orange
    'bg-[#F3E5F5] text-[#4A148C]', // Lilac
    'bg-[#E8F5E9] text-[#1B5E20]', // Mint
];

export const MOMENT_INTENT_LABELS: Record<string, string> = {
    morning: 'Morning Inspiration',
    midday: 'Midday Pause',
    evening: 'Evening Reflection',
    night: 'Restful Sleep',
    anxiety: 'Anxiety Relief',
    joy: 'Joy & Praise',
    grief: 'Comfort',
    new_user: 'Welcome',
    encouragement: 'Encouragement'
};
