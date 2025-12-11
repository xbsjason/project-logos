import { useState } from 'react';
import { BottomNav } from './BottomNav';
import { MiniPlayer } from '../audio/MiniPlayer';
import { AudioSelector } from '../audio/AudioSelector';
import { SearchOverlay } from '../search/SearchOverlay';
import { Outlet } from 'react-router-dom';

export interface AppSearchContext {
    toggleSearch: () => void;
}

interface AppShellProps {
    children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <div className="min-h-screen bg-cream-100 text-navy font-sans antialiased flex flex-col items-center">
            <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col pb-16">
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <Outlet context={{ toggleSearch: () => setIsSearchOpen(true) }} />
                </main>
                <MiniPlayer />
                <AudioSelector />
                <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
                <BottomNav />
            </div>
        </div>
    );
}
