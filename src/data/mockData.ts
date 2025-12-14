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
        authorId: 'user-1',
        author: {
            name: 'GraceWalker',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace'
        },
        type: 'image',
        // High quality nature portrait
        content: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&auto=format&fit=crop&q=80',
        caption: 'Morning quiet time. The sunrise reminds me of His mercies which are new every morning. #blessed #creation',
        likes: 124,
        comments: 15,
        shares: 4,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        verse: {
            ref: 'Lamentations 3:22-23',
            text: 'The steadfast love of the Lord never ceases; his mercies never come to an end...'
        }
    },
    {
        id: '2',
        authorId: 'user-2',
        author: {
            name: 'WorshipDaily',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Worship'
        },
        type: 'text',
        // Content acts as the main text
        content: 'In the waiting, in the searching, in the healing, and the hurting... You are still God.',
        caption: 'He is faithful in every season.',
        likes: 89,
        comments: 8,
        shares: 22,
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        song: {
            title: 'Seasons',
            artist: 'Hillsong Worship'
        }
    },
    {
        id: '3',
        authorId: 'user-3',
        author: {
            name: 'BibleStudyGroup',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Study'
        },
        type: 'verse_art',
        // Vertical bible art style image
        content: 'https://images.unsplash.com/photo-1507692049790-de58293a4697?w=800&auto=format&fit=crop&q=80',
        caption: 'Join us for reading John 3 tomorrow! Let’s dive deep.',
        likes: 45,
        comments: 20,
        shares: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        verse: {
            ref: 'John 3:16',
            text: 'For God so loved the world that He gave His only begotten Son...'
        }
    },
    {
        id: '4',
        authorId: 'user-4',
        author: {
            name: 'SarahJ',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
        },
        type: 'prayer',
        content: 'Please pray for my mother\'s surgery tomorrow. We are trusting God for a full recovery and peace for the family.',
        caption: 'Trusting in Him.',
        likes: 0,
        comments: 24,
        shares: 2,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        prayerCount: 24,
        answered: false
    },
    {
        id: '5',
        authorId: 'user-5',
        author: {
            name: 'DavidM',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
        },
        type: 'praise',
        content: 'Praise report! I finally found a job after 6 months of searching. God is faithful to provide right on time!',
        caption: 'He is Jehovah Jireh!',
        likes: 0,
        comments: 45,
        shares: 10,
        createdAt: new Date(Date.now() - 18000000).toISOString(),
        prayerCount: 156,
        answered: true
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
