import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-16 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            className={clsx(
                                "pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 min-w-[280px] max-w-[90vw] backdrop-blur-xl transition-all duration-300",
                                toast.type === 'success' ? "bg-black border-green-500/50 text-white" :
                                    toast.type === 'error' ? "bg-black border-red-500/50 text-white" :
                                        "bg-black border-blue-500/50 text-white"
                            )}
                        >
                            {toast.type === 'success' && <CheckCircle2 size={20} className="text-green-400 shrink-0" />}
                            {toast.type === 'error' && <AlertCircle size={20} className="text-red-400 shrink-0" />}
                            {toast.type === 'info' && <Info size={20} className="text-blue-400 shrink-0" />}

                            <span className="text-sm font-bold leading-tight">{toast.message}</span>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={14} className="text-gray-400" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
