import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight } from 'lucide-react';

export function WelcomePage() {
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        await signIn();
        navigate('/');
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
                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-gold hover:bg-gold-light text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        Get Started
                        <ArrowRight size={20} />
                    </button>

                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 active:scale-[0.98] transition-all"
                    >
                        I already have an account
                    </button>
                </div>

                <p className="text-white/40 text-xs mt-8">
                    By continuing, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
}
