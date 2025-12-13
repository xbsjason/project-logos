import { ArrowLeft, Camera, Check, Loader2 } from 'lucide-react';
import { SacredLoader } from '../../components/ui/SacredLoader';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; // Import from 'firebase/auth'
import { auth, db, storage } from '../../services/firebase'; // Added storage
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Added storage imports

import { useRef } from 'react'; // Added useRef
import { compressImage } from '../../utils/imageUtils'; // Import compression utility

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
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
    const [uploadingPhoto, setUploadingPhoto] = useState(false); // State for photo upload
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Local preview state
    const [firestorePhotoUrl, setFirestorePhotoUrl] = useState<string | null>(null); // Fresh from DB

    useEffect(() => {
        const fetchExtendedData = async () => {
            if (user?.uid) {
                const docRef = doc(db, 'users', user.uid);
                // Use getDoc (or onSnapshot if we wanted real-time here too, but getDoc is likely fine for "on entry")
                // Actually, since we want to be SURE we see the update we just made if we navigated back quickly,
                // getDoc from server or onSnapshot is best. 
                // Let's us onSnapshot to be consistent with ProfilePage and guarantee freshness.
                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setBio(data.bio || '');
                        setWebsite(data.website || '');
                        if (data.username) {
                            setUsername(data.username);
                            setOriginalUsername(data.username);
                            setUsernameAvailable(true);
                        }
                        if (data.photoURL) {
                            setFirestorePhotoUrl(data.photoURL);
                        }
                    }
                    setLoading(false);
                });
                return () => unsubscribe();
            } else {
                setLoading(false);
            }
        };
        fetchExtendedData();
    }, [user?.uid]); // Only depend on UID changing

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
        return <SacredLoader message="Loading profile..." />;
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

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];

            // Basic validation
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File is too large. Please choose an image under 5MB.");
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert("Please select a valid image file.");
                return;
            }

            // SET LOCAL PREVIEW IMMEDIATELY
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            setUploadingPhoto(true);
            try {
                // Validate user state
                if (!auth.currentUser) {
                    throw new Error("No authenticated user found. Please sign in again.");
                }

                console.log("[Photo Upload] Starting upload for user:", user.uid);
                console.log("[Photo Upload] Auth current user:", auth.currentUser.uid);

                // Verify UIDs match
                if (auth.currentUser.uid !== user.uid) {
                    console.error("[Photo Upload] UID mismatch! Context user:", user.uid, "Auth user:", auth.currentUser.uid);
                }

                // 1. CLEANUP: Delete old photo if it exists and is a firebase storage URL
                if (user.photoURL && user.photoURL.includes('firebasestorage.googleapis.com')) {
                    try {
                        const oldImageRef = ref(storage, user.photoURL);
                        await deleteObject(oldImageRef);
                        console.log("[Photo Upload] Old photo deleted successfully");
                    } catch (cleanupError) {
                        console.warn("[Photo Upload] Failed to cleanup old profile photo:", cleanupError);
                    }
                }

                // Compress image before upload
                console.log("[Photo Upload] Compressing image...");
                const compressedBlob = await compressImage(file);
                console.log("[Photo Upload] Compressed to:", compressedBlob.size, "bytes");

                // 2. UNIQUE FILENAME: Append timestamp to force browser cache refresh
                const timestamp = Date.now();
                const storagePath = `profile_photos/${user.uid}_${timestamp}`;
                console.log("[Photo Upload] Uploading to:", storagePath);
                const storageRef = ref(storage, storagePath);

                await uploadBytes(storageRef, compressedBlob);
                console.log("[Photo Upload] Upload complete, getting download URL...");

                const photoURL = await getDownloadURL(storageRef);
                console.log("[Photo Upload] New photoURL:", photoURL);

                // Update Auth Profile
                console.log("[Photo Upload] Updating Firebase Auth profile...");
                await updateProfile(auth.currentUser, { photoURL });
                console.log("[Photo Upload] Auth profile updated");

                // Update Firestore
                console.log("[Photo Upload] Updating Firestore document...");
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { photoURL });
                console.log("[Photo Upload] Firestore updated successfully!");

                // Update local preview to use the actual URL now
                setPreviewUrl(photoURL);

            } catch (error) {
                console.error("[Photo Upload] Error uploading photo:", error);
                alert(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setPreviewUrl(null);
            } finally {
                setUploadingPhoto(false);
            }
        }
    };


    return (
        <div className="bg-background min-h-full pb-20 transition-colors duration-300">
            <div className="bg-surface border-b border-default px-4 h-14 flex items-center justify-between shadow-sm sticky top-0 z-10 transition-colors">
                <button onClick={() => navigate(-1)} className="text-primary">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-primary text-lg">Edit Profile</h1>
                <button onClick={handleSave} disabled={saving || !usernameAvailable || checkingUsername} className="text-accent font-bold disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} />}
                </button>
            </div>

            {/* Context Message for Missing Username */}
            {!originalUsername && (
                <div className="bg-gold/10 px-4 py-3 text-center border-b border-gold/20">
                    <p className="text-sm text-primary font-medium">
                        Please choose a username to complete your profile.
                    </p>
                </div>
            )}

            <div className="flex flex-col items-center py-8">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                <div onClick={handlePhotoClick} className="relative group cursor-pointer inline-block">
                    <img
                        src={previewUrl || firestorePhotoUrl || user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason"}
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-surface shadow-md bg-surface-highlight object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploadingPhoto ? <Loader2 className="text-white animate-spin" size={24} /> : <Camera className="text-white" size={24} />}
                    </div>
                </div>
                <button
                    onClick={handlePhotoClick}
                    className="text-accent text-sm font-bold mt-3 hover:text-highlight transition-colors"
                    disabled={uploadingPhoto}
                >
                    {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </button>
            </div>

            <div className="px-4 space-y-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 bg-surface rounded-xl border border-default text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder-secondary"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full p-4 bg-surface rounded-xl border border-default text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder-secondary"
                        placeholder="@username"
                    />

                    {/* Username Feedback */}
                    <div className="ml-1 min-h-[20px]">
                        {checkingUsername && (
                            <p className="text-xs text-secondary flex items-center gap-1">
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
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full p-4 bg-surface rounded-xl border border-default text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none placeholder-secondary"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Website</label>
                    <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full p-4 bg-surface rounded-xl border border-default text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder-secondary"
                    />
                </div>
            </div>
        </div>
    );
}
