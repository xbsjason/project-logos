import { ArrowLeft, Camera, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function EditProfilePage() {
    const navigate = useNavigate();
    const [name, setName] = useState('Jason Rybka');
    const [bio, setBio] = useState('Walking by faith, not by sight. 🌿 Psalm 23 is my anchor.');
    const [website, setWebsite] = useState('faithvoice.app');

    return (
        <div className="bg-cream-50 min-h-full pb-20">
            <div className="bg-white border-b border-cream-200 px-4 h-14 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-navy">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-navy text-lg">Edit Profile</h1>
                <button onClick={() => navigate(-1)} className="text-gold-dark font-bold">
                    <Check size={24} />
                </button>
            </div>

            <div className="flex flex-col items-center py-8">
                <div className="relative group cursor-pointer">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jason"
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-cream-200"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                    <p className="text-gold-dark text-sm font-bold mt-2 text-center">Change Photo</p>
                </div>
            </div>

            <div className="px-4 space-y-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-navy uppercase ml-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 bg-white rounded-xl border border-cream-200 text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-navy uppercase ml-1">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full p-4 bg-white rounded-xl border border-cream-200 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-navy uppercase ml-1">Website</label>
                    <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full p-4 bg-white rounded-xl border border-cream-200 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                </div>
            </div>
        </div>
    );
}
