import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight } from 'lucide-react';

export function WelcomePage() {
    const { signIn, signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async () => {
        setIsSigningIn(true);
        setError(null);
        try {
            await signIn();
            // Navigation handled by useEffect
        } catch (err: any) {
            console.error(err);
            // Show specific error to help debugging
            const errorMessage = err.code ? `Error: ${err.code}` : (err.message || 'Failed to sign in');
            setError(errorMessage);
            setIsSigningIn(false);
        }
    };

    return (
        <div className="h-screen w-full bg-navy relative overflow-hidden flex flex-col items-center justify-end pb-12">
            {/* Background with Overlay */}
            <img
                src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1000&auto=format&fit=crop&q=80"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-md px-6 text-center">
                <div className="mb-8">
                    <h1 className="font-serif text-5xl text-white font-bold mb-2">FaithVoice</h1>
                    <p className="text-white/80 text-lg">Your daily sanctuary.</p>
                </div>

                <div className="space-y-4">
                    {error && (
                        <div className="bg-red-500/20 text-red-100 p-3 rounded-lg text-sm mb-4 border border-red-500/50">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={async () => {
                            setIsSigningIn(true);
                            try {
                                await signInWithGoogle();
                            } catch (error) {
                                console.error(error);
                                setIsSigningIn(false);
                            }
                        }}
                        disabled={isSigningIn}
                        className="w-full py-4 bg-white text-navy font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full py-4 bg-gold hover:bg-gold-light text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        Create Account
                        <ArrowRight size={20} />
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        I already have an account
                    </button>

                    <button
                        onClick={handleLogin}
                        disabled={isSigningIn}
                        className="text-white/60 text-sm hover:text-white transition-colors"
                    >
                        Skip for now (Guest)
                    </button>
                </div>

                <p className="text-white/40 text-xs mt-8">
                    By continuing, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
}
