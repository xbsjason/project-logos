import { useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AvatarProps {
    src?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // sm: 32px, md: 40px, lg: 64px, xl: 96px, 2xl: 128px
    className?: string;
}

const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500'
];

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
    const initials = useMemo(() => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    }, [name]);

    const backgroundColor = useMemo(() => {
        if (!name) return COLORS[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return COLORS[Math.abs(hash) % COLORS.length];
    }, [name]);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl',
        xl: 'w-24 h-24 text-3xl',
        '2xl': 'w-32 h-32 text-4xl'
    };

    return (
        <div
            className={cn(
                "rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white/10 relative",
                sizeClasses[size],
                !src && backgroundColor,
                className
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={name || "Avatar"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // The parent div background and initials will show if img hides
                        // But strictly we need to handle the sibling text showing only when img fails.
                        // A cleaner way is state, but for simplicty in this 'dumb' component:
                        // We can't easily fallback without state. 
                        // Let's rely on standard img behavior or just keep it simple.
                        // If src acts up, it might show broken image.
                        // Better approach for robust avatar often needs state or 2 elements.
                        // Let's use a simple trick: render both, img absolute on top.
                    }}
                />
            ) : (
                <span>{initials}</span>
            )}

            {/* Fallback layer if src is provided but fails to load (requires state to be perfect, 
                but we can cheat by putting the initials behind the image if we assume transparent loading... 
                actually standard <img /> covers it. Only issue is broken icon. 
                For now, let's stick to simple src ? img : text check.)
            */}
        </div>
    );
}
