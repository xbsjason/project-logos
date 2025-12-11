import { ArrowLeft, Camera, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; // Import from 'firebase/auth'
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Added query imports

export function EditProfilePage() {
    const navigate = useNavigate();
    const { user, updateUsername } = useAuth();

    const [name, setName] = useState(user?.displayName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // new state for username check
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean>(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [originalUsername, setOriginalUsername] = useState('');

    useEffect(() => {
        const fetchExtendedData = async () => {
            if (user?.uid) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBio(data.bio || '');
                    setWebsite(data.website || '');
                    // Ensure local state matches if not set by auth context yet (username)
                    if (data.username) {
                        setUsername(data.username);
                        setOriginalUsername(data.username);
                        setUsernameAvailable(true); // Own username is available
                    }
                }
                setLoading(false);
            }
        };
        fetchExtendedData();
    }, [user]); // Removed username from dependency to avoid loop

    // Debounced username check
    useEffect(() => {
        const checkAvailability = async () => {
            if (!username) {
                setUsernameError(null);
                setUsernameAvailable(false);
                return;
            }

            // Normalization
            const normalized = username.toLowerCase();
            if (username !== normalized) {
                // Force lowercase in UI for updated value if you prefer, 
                // but here we just check normalized logic or rely on onChange to lowercase it.
            }

            // 1. FORMAT VALIDATION
            const validRegex = /^[a-z0-9_]{3,30}$/;
            if (!validRegex.test(normalized)) {
                setUsernameError("Username must be 3-30 characters, letters, numbers, or underscores.");
                setUsernameAvailable(false);
                setCheckingUsername(false);
                return;
            }

            // 2. CHECK IF CHANGED
            if (normalized === originalUsername?.toLowerCase()) {
                setUsernameError(null);
                setUsernameAvailable(true);
                setCheckingUsername(false);
                return;
            }

            // 3. CHECK AVAILABILITY
            setCheckingUsername(true);
            setUsernameError(null);

            try {
                const q = query(collection(db, 'users'), where('username', '==', normalized));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    setUsernameError("Username is already taken.");
                    setUsernameAvailable(false);
                } else {
                    setUsernameError(null);
                    setUsernameAvailable(true);
                }
            } catch (err) {
                console.error("Error checking username:", err);
                setUsernameError("Error checking availability.");
            } finally {
                setCheckingUsername(false);
            }
        };

        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [username, originalUsername]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center pt-20">
                <Loader2 className="animate-spin text-gold" size={32} />
            </div>
        );
    }

    const handleSave = async () => {
        if (!user || !auth.currentUser) return;

        // Block save if username invalid or checking
        if (checkingUsername || !usernameAvailable || usernameError) return;

        setSaving(true);
        try {
            // Update Auth Profile (Name, Photo)
            if (name !== user.displayName) {
                await updateProfile(auth.currentUser, { displayName: name });
            }

            // Update Username (via AuthContext helper to update local state too)
            if (username !== user.username) {
                await updateUsername(username);
            }

            // Update Firestore for other fields
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                bio,
                website,
                displayName: name // Sync name to firestore too just in case
            });

            navigate('/profile');
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="bg-cream-50 min-h-full pb-20">
            <div className="bg-white border-b border-cream-200 px-4 h-14 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-navy">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-navy text-lg">Edit Profile</h1>
                <button onClick={handleSave} disabled={saving || !usernameAvailable || checkingUsername} className="text-gold-dark font-bold disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} />}
                </button>
            </div>

            {/* Context Message for Missing Username */}
            {!originalUsername && (
                <div className="bg-gold/10 px-4 py-3 text-center border-b border-gold/20">
                    <p className="text-sm text-navy font-medium">
                        Please choose a username to complete your profile.
                    </p>
                </div>
            )}

            <div className="flex flex-col items-center py-8">
                <div className="relative group cursor-pointer">
                    <img
                        src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason"}
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
                    <label className="text-xs font-bold text-navy uppercase ml-1">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full p-4 bg-white rounded-xl border border-cream-200 text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-gold/50"
                        placeholder="@username"
                    />

                    {/* Username Feedback */}
                    <div className="ml-1 min-h-[20px]">
                        {checkingUsername && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" /> Checking availability...
                            </p>
                        )}
                        {!checkingUsername && usernameError && (
                            <p className="text-xs text-red-500">{usernameError}</p>
                        )}
                        {!checkingUsername && !usernameError && usernameAvailable && username !== originalUsername && (
                            <p className="text-xs text-green-600 font-medium">Username available</p>
                        )}
                    </div>
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
