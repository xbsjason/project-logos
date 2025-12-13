export interface Post {
    id: string;
    authorId: string; // Added for querying
    author: {
        name: string;
        avatar: string;
    };
    type: 'video' | 'image' | 'text' | 'prayer' | 'verse_art' | 'worship' | 'testimony' | 'praise';
    content: string; // URL for media or text content
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    createdAt: any; // Using any for Timestamp compatibility
    song?: {
        title: string;
        artist: string;
    };
    verse?: {
        ref: string;
        text: string;
    };
    // New fields
    answered?: boolean;
    prayerCount?: number;
}

export const MOCK_POSTS: Post[] = [
    {
        id: '1',
        authorId: 'mock-user-id',
        author: {
            name: 'GraceWalker',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace'
        },
        type: 'image',
        content: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60',
        caption: 'Quiet time this morning. The Lord is good! #blessed #morningdevotion',
        likes: 124,
        comments: 15,
        shares: 4,
        createdAt: new Date().toISOString(),
        verse: {
            ref: 'Psalm 46:10',
            text: 'Be still, and know that I am God.'
        }
    },
    {
        id: '2',
        authorId: 'mock-user-id',
        author: {
            name: 'WorshipDaily',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Worship'
        },
        type: 'text',
        content: 'Your faithfulness extends to every generation, like a thread of gold weaving through history.',
        caption: 'Reflecting on His faithfulness today.',
        likes: 89,
        comments: 8,
        shares: 22,
        createdAt: new Date().toISOString(),
        song: {
            title: 'Oceans (Where Feet May Fail)',
            artist: 'Hillsong United'
        }
    },
    {
        id: '3',
        authorId: 'mock-user-id',
        author: {
            name: 'BibleStudyGroup',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Study'
        },
        type: 'image',
        content: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&auto=format&fit=crop&q=60',
        caption: 'Join us for reading John 3 tomorrow!',
        likes: 45,
        comments: 20,
        shares: 1,
        createdAt: new Date().toISOString(),
        verse: {
            ref: 'John 3:16',
            text: 'For God so loved the world that He gave His only begotten Son...'
        }
    }
];

export interface PrayerRequest {
    id: string;
    author: {
        name: string;
        avatar: string;
    };
    content: string;
    prayerCount: number;
    isAnswered: boolean;
    timestamp: string;
    category: 'Request' | 'Praise';
}

export const MOCK_PRAYERS: PrayerRequest[] = [
    {
        id: '1',
        author: {
            name: 'SarahJ',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
        },
        content: 'Please pray for my mother\'s surgery tomorrow. We are trusting God for a full recovery.',
        prayerCount: 24,
        isAnswered: false,
        timestamp: '2h ago',
        category: 'Request'
    },
    {
        id: '2',
        author: {
            name: 'DavidM',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
        },
        content: 'Praise report! I finally found a job after 6 months of searching. God is faithful!',
        prayerCount: 156,
        isAnswered: true,
        timestamp: '5h ago',
        category: 'Praise'
    },
    {
        id: '3',
        author: {
            name: 'YouthGroupLeader',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youth'
        },
        content: 'Praying for our upcoming retreat this weekend. That hearts would be open.',
        prayerCount: 12,
        isAnswered: false,
        timestamp: '1d ago',
        category: 'Request'
    }
];
