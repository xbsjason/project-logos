import { ArrowLeft, Bell, Lock, HelpCircle, LogOut, ChevronRight, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function SettingsPage() {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/welcome');
    };

    return (
        <div className="bg-cream-50 min-h-full pb-20">
            <div className="bg-white border-b border-cream-200 px-4 h-14 flex items-center gap-4 shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-navy">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-navy text-lg">Settings</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Account Section */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">Account</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-cream-200 overflow-hidden">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-cream-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Lock size={20} />
                                </div>
                                <span className="text-navy font-medium">Privacy & Security</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Bell size={20} />
                                </div>
                                <span className="text-navy font-medium">Notifications</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                    </div>
                </section>

                {/* Preferences Section */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">Preferences</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-cream-200 overflow-hidden">
                        <div className="w-full flex items-center justify-between p-4 border-b border-cream-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-navy text-white rounded-lg">
                                    <Moon size={20} />
                                </div>
                                <span className="text-navy font-medium">Dark Mode</span>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support Section */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">Support</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-cream-200 overflow-hidden">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <HelpCircle size={20} />
                                </div>
                                <span className="text-navy font-medium">Help Center</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                    </div>
                </section>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full p-4 bg-white rounded-xl shadow-sm border border-cream-200 text-red-600 font-bold flex items-center justify-center gap-2"
                >
                    <LogOut size={20} />
                    Log Out
                </button>

                <div className="text-center text-xs text-gray-400 pt-4">
                    Version 1.0.0 (Build 42)
                </div>
            </div>
        </div>
    );
}
