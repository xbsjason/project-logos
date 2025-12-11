import { Music, Search } from 'lucide-react';
import { FeedContainer } from '../components/feed/FeedContainer';
import { MOCK_POSTS } from '../data/mockData';
import { useAudio } from '../contexts/AudioContext';
import { useOutletContext } from 'react-router-dom';
import type { AppSearchContext } from '../components/layout/AppShell';

export function HomePage() {
    const { togglePlay } = useAudio();
    const { toggleSearch } = useOutletContext<AppSearchContext>();

    return (
        <div className="h-full bg-black relative">
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
                <h1 className="text-white font-bold text-xl drop-shadow-md">FaithVoice</h1>
                <div className="flex gap-2">
                    <button
                        onClick={toggleSearch}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-all"
                    >
                        <Search size={20} />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-all"
                    >
                        <Music size={20} />
                    </button>
                </div>
            </div>
            <FeedContainer posts={MOCK_POSTS} />
        </div>
    );
}
