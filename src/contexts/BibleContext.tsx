import { createContext, useContext, useState } from 'react';

export type FontFamily = 'Merriweather' | 'Crimson Text' | 'Inter' | 'Public Sans';

interface BibleContextType {
    fontSize: number;
    setFontSize: (size: number) => void;
    fontFamily: FontFamily;
    setFontFamily: (font: FontFamily) => void;
    resetSettings: () => void;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

const DEFAULT_FONT_SIZE = 18;
const DEFAULT_FONT_FAMILY: FontFamily = 'Merriweather';
const STORAGE_KEY_SIZE = 'bible-font-size';
const STORAGE_KEY_FAMILY = 'bible-font-family';

export function BibleProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSizeState] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_SIZE);
        return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
    });

    const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_FAMILY);
        return (saved as FontFamily) || DEFAULT_FONT_FAMILY;
    });

    const setFontSize = (size: number) => {
        const newSize = Math.max(12, Math.min(32, size)); // Clamp between 12 and 32
        setFontSizeState(newSize);
        localStorage.setItem(STORAGE_KEY_SIZE, newSize.toString());
    };

    const setFontFamily = (font: FontFamily) => {
        setFontFamilyState(font);
        localStorage.setItem(STORAGE_KEY_FAMILY, font);
    };

    const resetSettings = () => {
        setFontSize(DEFAULT_FONT_SIZE);
        setFontFamily(DEFAULT_FONT_FAMILY);
    };

    return (
        <BibleContext.Provider value={{ fontSize, setFontSize, fontFamily, setFontFamily, resetSettings }}>
            {children}
        </BibleContext.Provider>
    );
}

export function useBibleSettings() {
    const context = useContext(BibleContext);
    if (context === undefined) {
        throw new Error('useBibleSettings must be used within a BibleProvider');
    }
    return context;
}
