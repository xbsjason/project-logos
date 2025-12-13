import { Settings, ExternalLink, LayoutGrid, HeartHandshake, Image as ImageIcon, Music, Mic, HandMetal, MessageCircle, UserPlus, UserCheck, Pencil } from 'lucide-react';
import { MOCK_POSTS } from '../../data/mockData';
import type { Post } from '../../data/mockData';
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Play } from 'lucide-react';
import { UserService, type UserProfile } from '../../services/UserService';

type TabType = 'grid' | 'prayer' | 'verse_art' | 'worship' | 'testimony' | 'praise';

export function ProfilePage() {
    const { user: currentUser } = useAuth();
    const { userId: paramUserId } = useParams();
    const navigate = useNavigate();

    // Determine whose profile we are viewing
    // If no param, or param matches current user, it's my profile
    const isOwnProfile = !paramUserId || (currentUser && paramUserId === currentUser.uid);
    const targetUserId = isOwnProfile ? currentUser?.uid : paramUserId;

    const [activeTab, setActiveTab] = useState<TabType>('grid');
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    // Fetch Profile Data
    // Fetch Profile Data
    useEffect(() => {
        if (!targetUserId) return;

        setLoading(true);

        // Define a variable to hold the unsubscribe function
        let unsubscribe: () => void;

        // 1. Try listening to the document by ID (Primary Method)
        // This covers the "Own Profile" case perfectly as targetUserId is the UID.
        const docRef = doc(db, 'users', targetUserId);

        unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                setProfileData(docSnap.data() as UserProfile);
                setLoading(false);
            } else {
                // 2. Fallback: If doc doesn't exist by ID, try finding by username
                // This handles mentions like @jason
                try {
                    const q = query(collection(db, 'users'), where('username', '==', targetUserId));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        setProfileData(userDoc.data() as UserProfile);
                        // NOTE: For 'other' users found by username, we are just fetching once here.
                        // Ideally we would subscribe to the found UID for real-time updates too, 
                        // but sticking to the ID-based subscription is most important for the "Edit Profile" flow.
                    } else {
                        setProfileData(null);
                    }
                } catch (err) {
                    console.error("Error fetching profile by username:", err);
                    setProfileData(null);
                } finally {
                    setLoading(false);
                }
            }
        }, (error) => {
            console.error("Error listening to profile:", error);
            setLoading(false);
        });

        // Cleanup subscription on unmount or id change
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [targetUserId]);

    // Check follow status if viewing someone else (Separate Effect)
    useEffect(() => {
        if (!isOwnProfile && currentUser && targetUserId) {
            UserService.isFollowing(currentUser.uid, targetUserId)
                .then(setIsFollowing)
                .catch(console.error);
        }
    }, [targetUserId, isOwnProfile, currentUser]);


    // Fetch Posts
    useEffect(() => {
        const fetchPosts = async () => {
            if (!targetUserId) return;
            // distinct loading state for posts if needed, but reusing main loading for simplicity or just let it load in background

            try {
                const constraints = [
                    where("authorId", "==", targetUserId),
                    orderBy('createdAt', 'desc')
                ];

                if (activeTab !== 'grid') {
                    constraints.splice(1, 0, where("type", "==", activeTab));
                }

                const q = query(collection(db, 'posts'), ...constraints);
                const querySnapshot = await getDocs(q);
                const fetchedPosts: Post[] = [];

                querySnapshot.forEach((doc) => {
                    fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
                });

                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Error fetching posts:", error);
                if (activeTab === 'grid') {
                    setPosts(MOCK_POSTS);
                } else {
                    setPosts(MOCK_POSTS.filter(p => p.type === activeTab));
                }
            }
        };

        fetchPosts();
    }, [targetUserId, activeTab]);



    const handleFollowToggle = async () => {
        if (!currentUser || !targetUserId || followLoading) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await UserService.unfollowUser(currentUser.uid, targetUserId);
                setIsFollowing(false);
            } else {
                await UserService.followUser(currentUser.uid, targetUserId);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setFollowLoading(false);
        }
    };

    const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
        { id: 'grid', icon: <LayoutGrid size={24} />, label: 'All' },
        { id: 'prayer', icon: <HeartHandshake size={24} />, label: 'Prayer' },
        { id: 'verse_art', icon: <ImageIcon size={24} />, label: 'Verse Art' },
        { id: 'worship', icon: <Music size={24} />, label: 'Worship' },
        { id: 'testimony', icon: <Mic size={24} />, label: 'Testimony' },
        { id: 'praise', icon: <HandMetal size={24} />, label: 'Praise' },
    ];

    const renderContent = () => {
        if (posts.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                    <div className="bg-white dark:bg-navy-800 p-4 rounded-full mb-3 shadow-sm">
                        {tabs.find(t => t.id === activeTab)?.icon}
                    </div>
                    <p>No {activeTab === 'grid' ? 'posts' : activeTab.replace('_', ' ')} yet</p>
                </div>
            );
        }

        if (activeTab === 'prayer') {
            return (
                <div className="flex flex-col gap-2 p-2 animate-in fade-in duration-300">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white dark:bg-navy-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-navy-800">
                            <p className="text-navy dark:text-cream-50 mb-3 font-serif">{post.content}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>{post.prayerCount || 0} prayed</span>
                                {post.answered && (
                                    <span className="bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full font-medium">Answered</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'testimony' || activeTab === 'praise') {
            return (
                <div className="flex flex-col gap-2 p-2 animate-in fade-in duration-300">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white dark:bg-navy-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-navy-800">
                            {activeTab === 'praise' && (
                                <span className="inline-block bg-gold/10 text-gold text-xs font-bold px-2 py-0.5 rounded mb-2">PRAISE REPORT</span>
                            )}
                            <p className="text-navy dark:text-cream-50 leading-relaxed">{post.content}</p>
                        </div>
                    ))}
                </div>
            );
        }

        // Grid Layout
        return (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                {posts.map((post) => (
                    <div key={`profile-${post.id}`} className="relative aspect-[3/4] bg-gray-200 dark:bg-navy-800 overflow-hidden" onClick={() => navigate(`/post/${post.id}`)}>
                        {post.type === 'image' || post.type === 'verse_art' ? (
                            <img src={post.content} className="w-full h-full object-cover" alt="" />
                        ) : post.type === 'video' || post.type === 'worship' ? (
                            <>
                                <img src={post.content} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Play className="text-white fill-white" size={24} />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full bg-navy dark:bg-navy-900 p-2 flex items-center justify-center text-center">
                                <p className="text-white dark:text-cream-50 text-[10px] line-clamp-4 font-serif">"{post.content}"</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (loading && !profileData) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Profile...</div>;
    }

    if (!profileData && !loading) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">User not found</div>;
    }

    return (
        <div className="h-full w-full overflow-y-auto pb-20 bg-background min-h-screen transition-colors duration-300">
            {/* Minimal Header */}
            <div className="sticky top-0 z-10 flex justify-end px-4 py-2 pointer-events-none">
                <div className="pointer-events-auto">
                    {isOwnProfile && (
                        <Link to="/settings" className="text-primary p-2 block bg-surface/50 backdrop-blur-md rounded-full hover:bg-surface/80 transition-all">
                            <Settings size={20} />
                        </Link>
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center pt-2 pb-6 px-4 text-center -mt-8">
                <div className="relative">
                    {profileData?.photoURL ? (
                        <img
                            src={profileData.photoURL}
                            alt={profileData.displayName || "Profile"}
                            className="w-24 h-24 rounded-full border-4 border-surface shadow-md object-cover dark:border-navy-700"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-surface shadow-md dark:border-navy-700 bg-gradient-to-br from-gold/80 to-gold-dark flex items-center justify-center">
                            <span className="text-3xl font-bold text-white font-serif">
                                {(profileData?.displayName || profileData?.username || '?').charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-gold text-white text-[10px] px-2 py-0.5 rounded-full border-2 border-surface shadow-sm font-bold">
                        LVL 12
                    </div>
                </div>

                <div className="flex items-center gap-2 justify-center">
                    <h2 className="text-xl font-bold text-primary">{profileData?.displayName}</h2>
                    {isOwnProfile && (
                        <button
                            onClick={() => navigate('/profile/edit')}
                            className="text-secondary hover:text-primary transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                    )}
                </div>

                <p className="text-secondary text-sm">
                    {profileData?.username
                        ? (profileData.username.startsWith('@') ? profileData.username : `@${profileData.username}`)
                        : '@faithful'}
                </p>

                <div className="flex gap-4 mt-6 w-full max-w-xs justify-center">
                    <Link to={targetUserId ? `/profile/${targetUserId}/following` : '#'} className="text-center group cursor-pointer hover:bg-surface-highlight p-2 rounded-lg transition-colors">
                        <span className="block font-bold text-primary text-lg group-hover:text-accent transition-colors">{profileData?.stats?.following || 0}</span>
                        <span className="text-xs text-secondary">Following</span>
                    </Link>
                    <Link to={targetUserId ? `/profile/${targetUserId}/followers` : '#'} className="text-center group cursor-pointer hover:bg-surface-highlight p-2 rounded-lg transition-colors">
                        <span className="block font-bold text-primary text-lg group-hover:text-accent transition-colors">{profileData?.stats?.followers || 0}</span>
                        <span className="text-xs text-secondary">Followers</span>
                    </Link>
                    <div className="text-center p-2">
                        <span className="block font-bold text-primary text-lg">{profileData?.stats?.devotionals || 0}</span>
                        <span className="text-xs text-secondary">Devotionals</span>
                    </div>
                </div>

                {profileData?.bio && (
                    <p className="text-primary text-sm mt-4 px-6 leading-relaxed whitespace-pre-wrap">
                        {profileData.bio}
                    </p>
                )}

                {profileData?.website && (
                    <a
                        href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-accent text-sm font-medium mt-2 hover:underline"
                    >
                        <ExternalLink size={14} />
                        {profileData.website.replace(/^https?:\/\//, '')}
                    </a>
                )}

                <div className="flex gap-2 w-full max-w-xs mt-4">
                    {!isOwnProfile && (
                        <>
                            <button
                                onClick={handleFollowToggle}
                                disabled={followLoading}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${isFollowing
                                    ? 'bg-surface border border-default text-primary'
                                    : 'bg-primary text-inverse border border-primary'
                                    }`}
                            >
                                {followLoading ? (
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : isFollowing ? (
                                    <>
                                        <UserCheck size={16} />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={16} />
                                        Follow
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {/* navigate to message */ }}
                                className="flex-1 py-2 bg-surface border border-default rounded-lg text-sm font-semibold text-primary flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={16} />
                                Message
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-14 bg-background z-10 border-b border-default shadow-sm transition-colors duration-300">
                <div className="flex overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 min-w-[60px] flex-col items-center justify-center py-3 px-1 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-accent text-primary'
                                : 'border-transparent text-secondary hover:text-primary'
                                }`}
                            aria-label={tab.label}
                        >
                            {tab.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[300px]">
                {renderContent()}
            </div>
        </div>
    );
}
