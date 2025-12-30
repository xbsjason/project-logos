import { useEffect } from 'react';
import { useAuth } from './state/AuthContext';
import { db } from './services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function HeadlessApp() {
    const { user, loading } = useAuth();

    // Logic extracted from App.tsx ProtectedLayout
    useEffect(() => {
        if (user && user.email === 'xbsjason@gmail.com') {
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, { isFounder: true })
                .then(() => console.log('Founder status granted to ' + user.email))
                .catch(err => console.error('Failed to grant founder status:', err));
        }
    }, [user]);

    if (loading) return <div>Loading Logic...</div>;

    return null;
}
