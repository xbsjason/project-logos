import { Search } from 'lucide-react';

interface SearchTriggerProps {
    onClick: () => void;
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
    return (
        <div className="fixed bottom-32 left-0 right-0 z-40 pointer-events-none flex justify-center">
            <div className="w-full max-w-md relative px-4 text-right">
                <button
                    onClick={onClick}
                    className="pointer-events-auto p-4 bg-navy-dark/90 backdrop-blur-md text-white rounded-full shadow-lg border border-white/10 hover:scale-105 active:scale-95 transition-all duration-200 group inline-flex"
                    aria-label="Search"
                >
                    <Search size={24} className="group-hover:text-gold transition-colors" />
                </button>
            </div>
        </div>
    );
}
