import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    email: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate auth check
        const storedUser = localStorage.getItem('faithvoice_user');
        setTimeout(() => {
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        }, 500);
    }, []);

    const signIn = async () => {
        const mockUser = {
            uid: 'test-user-1',
            displayName: 'Faithful User',
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Faith',
            email: 'test@faithvoice.app'
        };
        setUser(mockUser);
        localStorage.setItem('faithvoice_user', JSON.stringify(mockUser));
    };

    const signOut = async () => {
        setUser(null);
        localStorage.removeItem('faithvoice_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
