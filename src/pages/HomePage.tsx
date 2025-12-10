import { Music } from 'lucide-react';
import { FeedContainer } from '../components/feed/FeedContainer';
import { MOCK_POSTS } from '../data/mockData';
import { useAudio } from '../contexts/AudioContext';

export function HomePage() {
    const { togglePlay } = useAudio();

    return (
        <div className="h-full bg-black relative">
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
                <h1 className="text-white font-bold text-xl drop-shadow-md">FaithVoice</h1>
                <button
                    onClick={togglePlay}
                    className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-all"
                >
                    <Music size={20} />
                </button>
            </div>
            <FeedContainer posts={MOCK_POSTS} />
        </div>
    );
}
