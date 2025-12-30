import React from 'react';
import './BottomNav.css';
import { Home, Heart, PlusSquare, Search, BookOpen, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
    return (
        <nav className="bottomNav">
            <div className="navItem active">
                <Home size={24} strokeWidth={2.5} />
                <span className="navLabel">Home</span>
            </div>
            <div className="navItem">
                <Heart size={24} />
                <span className="navLabel">Prayer</span>
            </div>
            <div className="navItem">
                <PlusSquare size={24} />
                <span className="navLabel">Create</span>
            </div>
            <div className="navItem">
                <Search size={24} />
                <span className="navLabel">Explore</span>
            </div>
            <div className="navItem">
                <BookOpen size={24} />
                <span className="navLabel">Bible</span>
            </div>
            <div className="navItem">
                <User size={24} />
                <span className="navLabel">Profile</span>
            </div>
        </nav>
    );
};
