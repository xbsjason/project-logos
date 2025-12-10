import { Settings, Grid, Bookmark } from 'lucide-react';
import { MOCK_POSTS } from '../../data/mockData';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ProfilePage() {
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

    return (
        <div className="pb-20 bg-cream-50 min-h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-cream-200 flex items-center justify-between px-4 h-14 shadow-sm">
                <h1 className="font-bold text-navy text-lg">My Profile</h1>
                <Link to="/settings" className="text-navy">
                    <Settings size={22} />
                </Link>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center pt-8 pb-6 px-4 text-center">
                <div className="relative mb-4">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jason"
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-cream-200"
                    />
                    <div className="absolute bottom-0 right-0 bg-gold text-white p-1.5 rounded-full border-2 border-white">
                        <div className="text-[10px] font-bold">12</div>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-navy">Jason Rybka</h2>
                <p className="text-gray-500 text-sm">@jasonrybka</p>

                <div className="flex gap-4 mt-6 w-full max-w-xs justify-center">
                    <div className="text-center">
                        <span className="block font-bold text-navy text-lg">142</span>
                        <span className="text-xs text-gray-500">Following</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-navy text-lg">8.5k</span>
                        <span className="text-xs text-gray-500">Followers</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-navy text-lg">12</span>
                        <span className="text-xs text-gray-500">Devotionals</span>
                    </div>
                </div>

                <p className="text-navy-light text-sm mt-4 px-6 leading-relaxed">
                    Walking by faith, not by sight. 🌿 Psalm 23 is my anchor.
                </p>

                <button className="mt-4 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-navy w-full max-w-xs">
                    Edit Profile
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mt-2">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 flex items-center justify-center p-3 border-b-2 text-navy ${activeTab === 'posts' ? 'border-navy' : 'border-transparent opacity-50'}`}
                >
                    <Grid size={24} />
                </button>
                <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex-1 flex items-center justify-center p-3 border-b-2 text-navy ${activeTab === 'saved' ? 'border-navy' : 'border-transparent opacity-50'}`}
                >
                    <Bookmark size={24} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                {MOCK_POSTS.map((post) => (
                    <div key={`profile-${post.id}`} className="relative aspect-[3/4] bg-gray-200">
                        {post.type === 'video' || post.type === 'image' ? (
                            <img src={post.content} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-navy p-2 flex items-center justify-center text-center">
                                <p className="text-white text-[8px] line-clamp-3">"{post.content}"</p>
                            </div>
                        )}
                    </div>
                ))}
                {/* Fill grid */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`fill-${i}`} className="relative aspect-[3/4] bg-gray-100"></div>
                ))}
            </div>
        </div>
    );
}
