export interface SearchResult {
    id: string;
    type: 'verse' | 'sermon' | 'user' | 'topic';
    title: string;
    subtitle: string;
    link: string;
}

export const MOCK_SEARCH_RESULTS: SearchResult[] = [
    {
        id: '1',
        type: 'verse',
        title: 'John 3:16',
        subtitle: 'For God so loved the world that he gave his one and only Son...',
        link: '/bible?book=John&chapter=3&verse=16'
    },
    {
        id: '2',
        type: 'topic',
        title: 'Peace',
        subtitle: 'Verses and sermons about finding peace in difficult times',
        link: '/explore?topic=peace'
    },
    {
        id: '3',
        type: 'sermon',
        title: 'Walking in Faith',
        subtitle: 'Pastor Michael Todd • Represent TV',
        link: '/watch/123'
    },
    {
        id: '4',
        type: 'user',
        title: 'Sarah Jenkins',
        subtitle: '@sarahj • 2.4k followers',
        link: '/profile/sarahj'
    },
    {
        id: '5',
        type: 'verse',
        title: 'Psalm 23:1',
        subtitle: 'The Lord is my shepherd, I lack nothing.',
        link: '/bible?book=Psalms&chapter=23&verse=1'
    }
];

export const SUGGESTED_SEARCHES = [
    'Anxiety',
    'Love',
    'Morning Prayer',
    'Sleep',
    'Hope'
];
