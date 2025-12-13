import { useState } from 'react';
import { BottomNav } from './BottomNav';
import { MiniPlayer } from '../audio/MiniPlayer';
import { AudioSelector } from '../audio/AudioSelector';
import { SearchOverlay } from '../search/SearchOverlay';
import { Outlet } from 'react-router-dom';
import { LayoutProvider, useLayout } from '../../contexts/LayoutContext';

export interface AppSearchContext {
    toggleSearch: () => void;
}

function AppShellContent() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { isBottomNavVisible } = useLayout();

    return (
        <div className="h-screen w-screen overflow-hidden bg-background text-primary font-sans antialiased flex flex-col items-center transition-colors duration-300">
            <div className="w-full max-w-md h-full bg-transparent relative shadow-2xl flex flex-col transition-colors duration-300">
                <main className="flex-1 relative h-full w-full overflow-hidden">
                    <Outlet context={{ toggleSearch: () => setIsSearchOpen(true) }} />
                </main>
                <MiniPlayer />
                <div className="absolute bottom-16 left-0 right-0 z-10">
                    <AudioSelector />
                </div>
                <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
                <BottomNav isVisible={isBottomNavVisible} />
            </div>
        </div>
    );
}

export function AppShell() {
    return (
        <LayoutProvider>
            <AppShellContent />
        </LayoutProvider>
    );
}

