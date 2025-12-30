export interface AudioTrack {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string; // In a real app, this would be a remote URL
    duration: number;
    category?: string;
    description?: string;
}

export interface AudioCategory {
    id: string;
    name: string;
    current?: boolean;
    order?: number; // Sorting
    coverUrl?: string; // Optional art
    tracks: AudioTrack[];
}

export interface AudioPlaylist {
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    trackIds: string[];
    isPublic: boolean;
    authorId: string;
    createdAt?: any;
    updatedAt?: any;
}

export const AUDIO_CATEGORIES: AudioCategory[] = [
    {
        id: 'worship',
        name: 'Worship',
        tracks: [
            {
                id: '1',
                title: 'Oceans (Where Feet May Fail)',
                artist: 'Hillsong United',
                coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&auto=format&fit=crop&q=60',
                audioUrl: 'https://cdn.pixabay.com/audio/2022/10/18/audio_31c2730e64.mp3', // Piano sample
                duration: 536
            },
            {
                id: '2',
                title: 'Goodness of God',
                artist: 'Bethel Music',
                coverUrl: 'https://images.unsplash.com/photo-1459749411177-d4a414c540da?w=400&auto=format&fit=crop&q=60',
                audioUrl: '',
                duration: 298
            },
            {
                id: '3',
                title: 'Way Maker',
                artist: 'Leeland',
                coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60',
                audioUrl: '',
                duration: 312
            }
        ]
    },
    {
        id: 'ambient',
        name: 'Ambient',
        tracks: [
            {
                id: 'a1',
                title: 'Quiet Reflection',
                artist: 'FaithVoice',
                coverUrl: 'https://images.unsplash.com/photo-1518176258769-f227c798150e?w=400&auto=format&fit=crop&q=60',
                audioUrl: '',
                duration: 900
            },
            {
                id: 'a2',
                title: 'Morning Dew',
                artist: 'FaithVoice',
                coverUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=400&auto=format&fit=crop&q=60',
                audioUrl: '',
                duration: 600
            }
        ]
    },
    {
        id: 'reading',
        name: 'Reading Mode',
        tracks: [
            {
                id: 'r1',
                title: 'Soft Piano',
                artist: 'FaithVoice',
                coverUrl: 'https://images.unsplash.com/photo-1520523830773-8053862b6db3?w=400&auto=format&fit=crop&q=60',
                audioUrl: '',
                duration: 1200
            },
            {
                id: 'r2',
                title: 'Deep Focus',
                artist: 'FaithVoice',
                coverUrl: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&auto=format&fit=crop&q=60',
                audioUrl: '',
                duration: 1200
            }
        ]
    },
    {
        id: 'featured',
        name: 'Featured',
        tracks: [
            {
                id: 'f1',
                title: 'Prophetic Flow',
                artist: 'Featured Channel',
                coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=60',
                audioUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', // Relaxing ambient sample
                duration: 600
            },
            {
                id: 'f2',
                title: 'Soaking Session',
                artist: 'Featured Channel',
                coverUrl: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&auto=format&fit=crop&q=60',
                audioUrl: '',
                duration: 900
            }
        ]
    }
];

// Flatten tracks for backward compatibility or simple searching if needed
export const ALL_TRACKS = AUDIO_CATEGORIES.flatMap(c => c.tracks);
