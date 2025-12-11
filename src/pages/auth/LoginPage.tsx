import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function LoginPage() {
    const { signInWithEmail } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await signInWithEmail(email, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to sign in');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-off-white flex flex-col px-6 pt-12 pb-6">
            <button
                onClick={() => navigate('/welcome')}
                className="self-start text-navy mb-8 p-2 -ml-2 rounded-full hover:bg-cream-100 transition-colors"
                disabled={isSubmitting}
            >
                <ArrowLeft size={24} />
            </button>

            <div className="w-full max-w-sm mx-auto">
                <h1 className="text-3xl font-serif font-bold text-navy mb-2">Welcome Back</h1>
                <p className="text-gray-500 mb-8">Sign in to continue your journey.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-navy/70 mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-navy"
                            placeholder="hello@example.com"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy/70 mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-navy"
                            placeholder="••••••••"
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-navy text-white font-bold rounded-xl shadow-lg mt-4 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="text-center mt-8 text-gray-500 text-sm">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-gold font-semibold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
