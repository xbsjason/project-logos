import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { UserService, type UserProfile } from '../../services/UserService';
import { UserPlus, UserCheck } from 'lucide-react';

interface UserListPageProps {
    type: 'followers' | 'following';
}

export function UserListPage({ type }: UserListPageProps) {
    const { userId: paramUserId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    // The user whose list we are viewing. If param is missing, assume it's current user (though route usually ensures param)
    const targetUserId = paramUserId || currentUser?.uid;

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!targetUserId) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const fetchedUsers = await UserService.getUsers(targetUserId, type);
                setUsers(fetchedUsers);

                // If logged in, check which of these users *I* am following
                if (currentUser) {
                    const status: Record<string, boolean> = {};
                    await Promise.all(fetchedUsers.map(async (u) => {
                        if (u.uid === currentUser.uid) return; // Skip self
                        const isFollowing = await UserService.isFollowing(currentUser.uid, u.uid);
                        status[u.uid] = isFollowing;
                    }));
                    setFollowingStatus(status);
                }
            } catch (error) {
                console.error("Error loading user list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [targetUserId, type, currentUser]);

    const handleFollowToggle = async (targetUser: UserProfile) => {
        if (!currentUser) return;

        const isFollowing = followingStatus[targetUser.uid];
        const newStatus = !isFollowing;

        // Optimistic update
        setFollowingStatus(prev => ({ ...prev, [targetUser.uid]: newStatus }));

        try {
            if (isFollowing) {
                await UserService.unfollowUser(currentUser.uid, targetUser.uid);
            } else {
                await UserService.followUser(currentUser.uid, targetUser.uid);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            // Revert on error
            setFollowingStatus(prev => ({ ...prev, [targetUser.uid]: isFollowing }));
        }
    };

    return (
        <div className="bg-cream-50 min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-cream-200 flex items-center px-4 h-14 shadow-sm gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="text-navy hover:bg-cream-100 p-2 rounded-full -ml-2 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-navy text-lg capitalize">{type}</h1>
            </div>

            {/* List */}
            <div className="p-4 flex flex-col gap-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p>No {type} found.</p>
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.uid} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <Link to={`/profile/${user.uid}`} className="flex items-center gap-3 flex-1 overflow-hidden">
                                <Avatar
                                    src={user.photoURL || undefined}
                                    name={user.displayName || 'User'}
                                    size="md"
                                />
                                <div className="min-w-0">
                                    <h3 className="font-bold text-navy truncate">{user.displayName || 'User'}</h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {user.username ? `@${user.username}` : ''}
                                    </p>
                                </div>
                            </Link>

                            {/* Avoid following self */}
                            {currentUser && currentUser.uid !== user.uid && (
                                <button
                                    onClick={() => handleFollowToggle(user)}
                                    className={`ml-2 p-2 rounded-lg transition-colors flex-shrink-0 ${followingStatus[user.uid]
                                            ? 'bg-gray-100 text-navy'
                                            : 'bg-navy/10 text-navy hover:bg-navy/20'
                                        }`}
                                >
                                    {followingStatus[user.uid] ? <UserCheck size={20} /> : <UserPlus size={20} />}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
