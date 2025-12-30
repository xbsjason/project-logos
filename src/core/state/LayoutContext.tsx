import { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextType {
    isBottomNavVisible: boolean;
    setBottomNavVisible: (visible: boolean) => void;
    isKeyboardOpen: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [isBottomNavVisible, setBottomNavVisible] = useState(true);
    // Keyboard detection logic removed to prevent global re-renders causing focus loss.
    // If needed in future, implement locally in specific components or use a memoized context that splits signals.

    // CRITICAL: Memoize the context value to prevent re-renders of ALL consumers every time this component re-renders
    // The useMemo is removed as the value is now directly passed to the Provider, and the dependencies are simple.
    // If more complex logic or expensive computations were involved, useMemo would be beneficial.

    return (
        <LayoutContext.Provider value={{ isBottomNavVisible, setBottomNavVisible, isKeyboardOpen: false }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
