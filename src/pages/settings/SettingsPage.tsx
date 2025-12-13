import { ArrowLeft, Bell, Lock, HelpCircle, LogOut, ChevronRight, Moon, Download, Loader2, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AVAILABLE_VERSIONS } from '../../contexts/BibleContext';
import { BibleService } from '../../services/BibleService';
import { SeedButton } from '../../components/debug/SeedButton';

export function SettingsPage() {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [downloadStatus, setDownloadStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

    const handleDownloadBible = async (versionId: string) => {
        if (downloadStatus[versionId] === 'loading' || downloadStatus[versionId] === 'success') return;

        // Find version name
        const versionName = AVAILABLE_VERSIONS.find(v => v.id === versionId)?.name || versionId;

        if (!confirm(`Download ${versionName} for offline use?`)) {
            return;
        }

        setDownloadStatus(prev => ({ ...prev, [versionId]: 'loading' }));
        try {
            await BibleService.downloadAllBooks(versionId);
            setDownloadStatus(prev => ({ ...prev, [versionId]: 'success' }));
        } catch (error) {
            console.error('Failed to download Bible', error);
            setDownloadStatus(prev => ({ ...prev, [versionId]: 'error' }));
            setTimeout(() => setDownloadStatus(prev => ({ ...prev, [versionId]: 'idle' })), 3000);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/welcome');
    };

    return (
        <div className="bg-background min-h-full pb-20 transition-colors duration-300">
            <div className="bg-surface border-b border-default px-4 h-14 flex items-center gap-4 shadow-sm sticky top-0 z-10 transition-colors duration-300">
                <button onClick={() => navigate(-1)} className="text-primary">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-primary text-lg">Settings</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Account Section */}
                <section>
                    <h2 className="text-sm font-bold text-secondary uppercase mb-2 px-2">Account</h2>
                    <div className="bg-surface rounded-xl shadow-sm border border-default overflow-hidden transition-colors duration-300">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-surface-highlight border-b border-default transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Lock size={20} />
                                </div>
                                <span className="text-primary font-medium">Privacy & Security</span>
                            </div>
                            <ChevronRight size={20} className="text-secondary" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 hover:bg-surface-highlight transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <Bell size={20} />
                                </div>
                                <span className="text-primary font-medium">Notifications</span>
                            </div>
                            <ChevronRight size={20} className="text-secondary" />
                        </button>
                    </div>
                </section>

                {/* Offline Access Section */}
                <section>
                    <h2 className="text-sm font-bold text-secondary uppercase mb-2 px-2">Offline Access</h2>
                    <div className="bg-surface rounded-xl shadow-sm border border-default overflow-hidden transition-colors duration-300 divide-y divide-default">
                        {AVAILABLE_VERSIONS.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => handleDownloadBible(v.id)}
                                disabled={downloadStatus[v.id] === 'loading' || downloadStatus[v.id] === 'success'}
                                className="w-full flex items-center justify-between p-4 hover:bg-surface-highlight transition-colors disabled:opacity-80"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${downloadStatus[v.id] === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gold/20 text-gold dark:text-gold'}`}>
                                        {downloadStatus[v.id] === 'loading' ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : downloadStatus[v.id] === 'success' ? (
                                            <Check size={20} />
                                        ) : (
                                            <Download size={20} />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <span className="text-primary font-medium block">
                                            {v.name}
                                        </span>
                                        <span className="text-xs text-secondary block mt-0.5">
                                            {downloadStatus[v.id] === 'loading' ? 'Downloading...' :
                                                downloadStatus[v.id] === 'success' ? 'Downloaded' :
                                                    'Tap to download'}
                                        </span>
                                    </div>
                                </div>
                                {downloadStatus[v.id] !== 'loading' && downloadStatus[v.id] !== 'success' && (
                                    <ChevronRight size={20} className="text-secondary" />
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Preferences Section */}
                <section>
                    <h2 className="text-sm font-bold text-secondary uppercase mb-2 px-2">Preferences</h2>
                    <div className="bg-surface rounded-xl shadow-sm border border-default overflow-hidden transition-colors duration-300">
                        <div className="w-full flex items-center justify-between p-4 border-b border-default">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-navy text-white dark:bg-white dark:text-navy rounded-lg">
                                    <Moon size={20} />
                                </div>
                                <span className="text-primary font-medium">Dark Mode</span>
                            </div>
                            <div
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isDark ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support Section */}
                <section>
                    <h2 className="text-sm font-bold text-secondary uppercase mb-2 px-2">Support</h2>
                    <div className="bg-surface rounded-xl shadow-sm border border-default overflow-hidden transition-colors duration-300">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-surface-highlight transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <HelpCircle size={20} />
                                </div>
                                <span className="text-primary font-medium">Help Center</span>
                            </div>
                            <ChevronRight size={20} className="text-secondary" />
                        </button>
                    </div>
                </section>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full p-4 bg-surface rounded-xl shadow-sm border border-default text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-surface-highlight transition-colors"
                >
                    <LogOut size={20} />
                    Log Out
                </button>

                {/* Debug Section */}
                <section>
                    <h2 className="text-sm font-bold text-secondary uppercase mb-2 px-2">Debug Tools</h2>
                    <div className="bg-surface rounded-xl shadow-sm border border-default overflow-hidden p-4 transition-colors duration-300">
                        <SeedButton />
                    </div>
                </section>

                <div className="text-center text-xs text-secondary pt-4">
                    Version 1.0.0 (Build 42)
                </div>
            </div>
        </div>
    );
}
