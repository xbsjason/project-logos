import { Loader2 } from 'lucide-react';

interface SacredLoaderProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export function SacredLoader({
    message = "Loading...",
    size = 'md',
    fullScreen = true
}: SacredLoaderProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const auraSizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    };

    const containerClasses = fullScreen
        ? 'fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50'
        : 'flex flex-col items-center justify-center py-16';

    return (
        <div className={`${containerClasses} transition-colors duration-300`}>
            {/* Sacred Aura Container */}
            <div className={`relative ${auraSizeClasses[size]} flex items-center justify-center animate-float`}>
                {/* Outer aura ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/20 to-transparent animate-sacred-aura" />

                {/* Middle pulsing ring */}
                <div className="absolute inset-2 rounded-full border-2 border-gold/30 animate-glowing-border" />

                {/* Inner spinning loader */}
                <div className="relative z-10 flex items-center justify-center">
                    <Loader2
                        className={`${sizeClasses[size]} text-gold animate-spin`}
                        strokeWidth={1.5}
                    />
                </div>

                {/* Decorative cross hint - very subtle */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-gold to-transparent" />
                    <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
                </div>
            </div>

            {/* Message */}
            {message && (
                <p className="mt-6 text-secondary text-sm font-medium animate-fade-in-up tracking-wide">
                    {message}
                </p>
            )}
        </div>
    );
}
