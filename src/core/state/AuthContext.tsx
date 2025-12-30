import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInAnonymously,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

interface User {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    email: string | null;
    username: string | null;
    isAnonymous: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>; // Anonymous
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string, name: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to sync user data to Firestore
    const syncUserToFirestore = async (firebaseUser: FirebaseUser) => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            const newUser = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                username: null,
                createdAt: serverTimestamp(),
                stats: {
                    following: 0,
                    followers: 0,
                    devotionals: 0
                }
            };
            await setDoc(userRef, newUser);
            return newUser;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                let firestoreData: any = null;
                // If not anonymous, sync to Firestore
                if (!firebaseUser.isAnonymous) {
                    firestoreData = await syncUserToFirestore(firebaseUser);
                }

                setUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Faithful User' : null),
                    photoURL: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Faith',
                    email: firebaseUser.email || null,
                    username: firestoreData?.username || null,
                    isAnonymous: firebaseUser.isAnonymous
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => { // Anonymous
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Error signing in anonymously:", error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            googleProvider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error("Error signing in with email:", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, pass: string, name: string, username: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(result.user, {
                displayName: name,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            });

            // Create Firestore document immediately with username
            const userRef = doc(db, 'users', result.user.uid);
            await setDoc(userRef, {
                uid: result.user.uid,
                displayName: name,
                email: email,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                username: username,
                createdAt: serverTimestamp(),
                stats: {
                    following: 0,
                    followers: 0,
                    devotionals: 0
                }
            });
        } catch (error) {
            console.error("Error signing up:", error);
            throw error;
        }
    };

    const updateUsername = async (username: string) => {
        if (!user) throw new Error('No user logged in');

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { username });

            // Update local state
            setUser(prev => prev ? { ...prev, username } : null);
        } catch (error) {
            console.error("Error updating username:", error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signIn,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            signOut,
            updateUsername
        }}>
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
