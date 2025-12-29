import { NavLink } from 'react-router-dom';
import { Home, Heart, PlusSquare, Compass, BookOpen, User } from 'lucide-react';
import { clsx } from 'clsx';

export function BottomNav({ isVisible = true }: { isVisible?: boolean }) {
    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/prayer', icon: Heart, label: 'Prayer' },
        { to: '/create', icon: PlusSquare, label: 'Create' },
        { to: '/explore', icon: Compass, label: 'Explore' },
        { to: '/bible', icon: BookOpen, label: 'Bible' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-between">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            clsx(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-secondary hover:text-primary"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive && label === 'Home' ? 'currentColor' : 'none'} className={isActive ? 'scale-110 transition-transform' : ''} />
                                <span className="text-[10px] font-medium">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
